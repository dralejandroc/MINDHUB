"""
Resources Views - Django REST Framework DUAL SYSTEM
Replaces Node.js Express routes with Django ViewSets
Supports:
- LICENCIA CLÍNICA: Shared resource library among all clinic professionals
- LICENCIA INDIVIDUAL: Private resource library for single professional
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.http import HttpResponse, FileResponse
from datetime import datetime, timedelta
import os
import mimetypes

from middleware.base_viewsets import ResourcesDualViewSet, DualSystemModelViewSet
from expedix.authentication import SupabaseProxyAuthentication

from .models import (
    ResourceCategory, Resource, WatermarkTemplate, ResourceEmailTemplate,
    ResourceSend, ResourceAccessLog, ResourceCollection, ResourceCollectionItem
)
from .serializers import (
    ResourceCategorySerializer, ResourceSerializer, ResourceUploadSerializer,
    ResourceSummarySerializer, WatermarkTemplateSerializer, ResourceEmailTemplateSerializer,
    ResourceSendSerializer, ResourceSendCreateSerializer, ResourceAccessLogSerializer,
    ResourceCollectionSerializer, ResourceCollectionItemSerializer,
    ResourceStatsSerializer, LibraryStatsSerializer
)


class ResourceCategoryViewSet(DualSystemModelViewSet):
    """🎯 DUAL SYSTEM Resource category management ViewSet"""
    queryset = ResourceCategory.objects.all()
    serializer_class = ResourceCategorySerializer
    authentication_classes = [SupabaseProxyAuthentication]  # ✅ RESTORED according to architecture
    permission_classes = [IsAuthenticated]                 # ✅ RESTORED according to architecture
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['parent', 'is_active']
    ordering_fields = ['sort_order', 'name', 'created_at']
    ordering = ['sort_order', 'name']

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical category tree"""
        root_categories = self.queryset.filter(parent=None, is_active=True)
        
        def build_tree(categories):
            tree = []
            for category in categories:
                category_data = self.get_serializer(category).data
                children = category.children.filter(is_active=True)
                if children.exists():
                    category_data['children'] = build_tree(children)
                tree.append(category_data)
            return tree
        
        tree_data = build_tree(root_categories)
        return Response(tree_data)


class ResourceViewSet(ResourcesDualViewSet):
    """
    🎯 DUAL SYSTEM Resource management ViewSet
    - LICENCIA CLÍNICA: Shared resources among all clinic professionals
    - LICENCIA INDIVIDUAL: Private resources for single professional
    """
    queryset = Resource.objects.select_related('category', 'owner', 'upload_by').filter(is_active=True)
    serializer_class = ResourceSerializer
    authentication_classes = [SupabaseProxyAuthentication]  # ✅ RESTORED according to architecture
    permission_classes = [IsAuthenticated]                 # ✅ RESTORED according to architecture
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'tags', 'full_text_content']
    filterset_fields = ['category', 'file_type', 'library_type']  # Removed owner (handled by dual system)
    ordering_fields = ['title', 'created_at', 'send_count', 'view_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ResourceUploadSerializer
        elif self.action == 'list':
            return ResourceSummarySerializer
        return ResourceSerializer

    def get_queryset(self):
        """
        🎯 DUAL SYSTEM: Already filtered by license type
        - LICENCIA CLÍNICA: All resources in clinic
        - LICENCIA INDIVIDUAL: Only user's resources
        """
        queryset = super().get_queryset()  # Already filtered by dual system
        
        # Additional filtering for sharing capabilities
        if hasattr(self.request, 'user_context'):
            sharing_scope = self.get_sharing_scope()
            if not sharing_scope.get('shareable', False):
                # Individual users only see their own resources
                queryset = queryset.filter(
                    Q(library_type='public') | 
                    Q(owner_id=self.request.supabase_user_id) |
                    Q(upload_by_id=self.request.supabase_user_id)
                )
        
        return queryset

    @action(detail=False, methods=['get'])
    def sharing_capabilities(self, request):
        """
        🎯 DUAL SYSTEM: Get resource sharing capabilities for current license type
        """
        sharing_scope = self.get_sharing_scope()
        
        return Response({
            'success': True,
            'license_type': getattr(request, 'user_context', {}).get('license_type'),
            'sharing_capabilities': sharing_scope,
            'can_share_resources': self.can_share_resources(),
            'accessible_locations': self.get_accessible_locations()
        })

    @action(detail=False, methods=['get'])
    def library(self, request):
        """Get resources by library type"""
        library_type = request.query_params.get('type', 'public')
        
        if library_type not in ['public', 'private', 'premium']:
            return Response(
                {'error': 'Invalid library type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        resources = self.get_queryset().filter(library_type=library_type)
        
        # Apply additional filters
        category = request.query_params.get('category')
        if category:
            resources = resources.filter(category_id=category)
        
        file_type = request.query_params.get('file_type')
        if file_type:
            resources = resources.filter(file_type=file_type)
        
        page = self.paginate_queryset(resources)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(resources, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download resource file"""
        resource = self.get_object()
        
        # Update view count
        resource.view_count += 1
        resource.save(update_fields=['view_count'])
        
        # Log access if this is from a resource send
        resource_send_id = request.query_params.get('send_id')
        if resource_send_id:
            try:
                resource_send = ResourceSend.objects.get(id=resource_send_id)
                ResourceAccessLog.objects.create(
                    resource_send=resource_send,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    action='download'
                )
                # Update download count
                resource_send.download_count += 1
                resource_send.save(update_fields=['download_count'])
            except ResourceSend.DoesNotExist:
                pass
        
        # Update resource download count
        resource.download_count += 1
        resource.save(update_fields=['download_count'])
        
        # Serve file
        if resource.file:
            response = FileResponse(
                resource.file.open('rb'),
                content_type=resource.mime_type
            )
            response['Content-Disposition'] = f'attachment; filename="{resource.original_filename}"'
            return response
        
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def send_to_patient(self, request, pk=None):
        """Send resource to patient"""
        resource = self.get_object()
        
        serializer = ResourceSendCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            resource_send = serializer.save(resource=resource)
            
            # TODO: Implement actual email sending if method is 'email'
            # TODO: Apply watermark if requested
            
            send_serializer = ResourceSendSerializer(resource_send)
            return Response(send_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Resource statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_resources': queryset.count(),
            'public_resources': queryset.filter(library_type='public').count(),
            'private_resources': queryset.filter(library_type='private').count(),
            'premium_resources': queryset.filter(library_type='premium').count(),
            'total_sends': ResourceSend.objects.filter(resource__in=queryset).count(),
            'total_downloads': queryset.aggregate(total=Sum('download_count'))['total'] or 0,
            'resources_by_type': dict(
                queryset.values_list('file_type').annotate(count=Count('id')).values_list('file_type', 'count')
            ),
            'recent_uploads': queryset.filter(
                created_at__gte=timezone.now() - timedelta(days=7)
            ).count()
        }
        
        serializer = ResourceStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced resource search"""
        query = request.query_params.get('q', '')
        if not query:
            return Response({'results': [], 'count': 0})
        
        resources = self.get_queryset().filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(full_text_content__icontains=query) |
            Q(tags__icontains=query)
        )[:20]  # Limit results
        
        serializer = ResourceSummarySerializer(resources, many=True)
        return Response({
            'results': serializer.data,
            'count': resources.count()
        })

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class WatermarkTemplateViewSet(viewsets.ModelViewSet):
    """Watermark template management ViewSet"""
    queryset = WatermarkTemplate.objects.all()
    serializer_class = WatermarkTemplateSerializer
    authentication_classes = [SupabaseProxyAuthentication]  # ✅ RESTORED according to architecture
    permission_classes = [IsAuthenticated]                 # ✅ RESTORED according to architecture
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'text_content']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ResourceEmailTemplateViewSet(viewsets.ModelViewSet):
    """Resource email template management ViewSet"""
    queryset = ResourceEmailTemplate.objects.all()
    serializer_class = ResourceEmailTemplateSerializer
    authentication_classes = [SupabaseProxyAuthentication]  # ✅ RESTORED according to architecture
    permission_classes = [IsAuthenticated]                 # ✅ RESTORED according to architecture
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'subject']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ResourceSendViewSet(viewsets.ModelViewSet):
    """Resource send tracking ViewSet"""
    queryset = ResourceSend.objects.select_related('resource', 'patient', 'sent_by').all()
    serializer_class = ResourceSendSerializer
    authentication_classes = [SupabaseProxyAuthentication]  # ✅ RESTORED according to architecture
    permission_classes = [IsAuthenticated]                 # ✅ RESTORED according to architecture
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['resource__title', 'patient__first_name', 'patient__paternal_last_name']
    filterset_fields = ['send_method', 'delivery_status', 'watermark_applied']
    ordering_fields = ['sent_at']
    ordering = ['-sent_at']

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get resource sends by patient"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id parameter required'}, status=400)
        
        sends = self.queryset.filter(patient_id=patient_id)
        serializer = self.get_serializer(sends, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_resource(self, request):
        """Get resource sends by resource"""
        resource_id = request.query_params.get('resource_id')
        if not resource_id:
            return Response({'error': 'resource_id parameter required'}, status=400)
        
        sends = self.queryset.filter(resource_id=resource_id)
        serializer = self.get_serializer(sends, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_viewed(self, request, pk=None):
        """Mark resource send as viewed"""
        resource_send = self.get_object()
        
        if not resource_send.viewed_at:
            resource_send.viewed_at = timezone.now()
            resource_send.save(update_fields=['viewed_at'])
        
        # Log access
        ResourceAccessLog.objects.create(
            resource_send=resource_send,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            action='view'
        )
        
        serializer = self.get_serializer(resource_send)
        return Response(serializer.data)

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ResourceCollectionViewSet(viewsets.ModelViewSet):
    """Resource collection management ViewSet"""
    queryset = ResourceCollection.objects.all()
    serializer_class = ResourceCollectionSerializer
    authentication_classes = [SupabaseProxyAuthentication]  # ✅ RESTORED according to architecture
    permission_classes = [IsAuthenticated]                 # ✅ RESTORED according to architecture
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = self.queryset.filter(user=self.request.user)
        
        # Include public collections
        public_collections = ResourceCollection.objects.filter(is_public=True)
        return queryset.union(public_collections)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Get collection items"""
        collection = self.get_object()
        items = ResourceCollectionItem.objects.filter(collection=collection).select_related('resource')
        
        serializer = ResourceCollectionItemSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_resource(self, request, pk=None):
        """Add resource to collection"""
        collection = self.get_object()
        resource_id = request.data.get('resource_id')
        
        if not resource_id:
            return Response(
                {'error': 'resource_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            resource = Resource.objects.get(id=resource_id, is_active=True)
        except Resource.DoesNotExist:
            return Response(
                {'error': 'Resource not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if resource is already in collection
        if ResourceCollectionItem.objects.filter(collection=collection, resource=resource).exists():
            return Response(
                {'error': 'Resource already in collection'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add resource to collection
        sort_order = request.data.get('sort_order', 0)
        item = ResourceCollectionItem.objects.create(
            collection=collection,
            resource=resource,
            sort_order=sort_order
        )
        
        serializer = ResourceCollectionItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_resource(self, request, pk=None):
        """Remove resource from collection"""
        collection = self.get_object()
        resource_id = request.data.get('resource_id')
        
        try:
            item = ResourceCollectionItem.objects.get(
                collection=collection,
                resource_id=resource_id
            )
            item.delete()
            return Response({'message': 'Resource removed from collection'})
        except ResourceCollectionItem.DoesNotExist:
            return Response(
                {'error': 'Resource not found in collection'},
                status=status.HTTP_404_NOT_FOUND
            )
