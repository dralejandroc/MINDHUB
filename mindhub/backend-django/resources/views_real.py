"""
Resources Views - REAL Supabase Schema
Using actual medical_resources and resource_categories tables
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
import json

# Import Supabase authentication
from expedix.authentication import SupabaseProxyAuthentication

from .models_real import MedicalResource, RealResourceCategory


class MedicalResourceSerializer:
    """Basic serializer for MedicalResource"""
    
    @staticmethod
    def serialize(resource):
        return {
            'id': str(resource.id),
            'clinic_id': str(resource.clinic_id),
            'created_by': str(resource.created_by),
            'title': resource.title,
            'description': resource.description,
            'content': resource.content,
            'resource_type': resource.resource_type,
            'category': resource.category,
            'tags': resource.tags or [],
            'file_url': resource.file_url,
            'file_size': resource.file_size,
            'file_type': resource.file_type,
            'thumbnail_url': resource.thumbnail_url,
            'is_public': resource.is_public,
            'is_template': resource.is_template,
            'download_count': resource.download_count or 0,
            'metadata': resource.metadata or {},
            'created_at': resource.created_at.isoformat() if resource.created_at else None,
            'updated_at': resource.updated_at.isoformat() if resource.updated_at else None,
            'formatted_file_size': resource.formatted_file_size
        }


class RealResourceCategorySerializer:
    """Basic serializer for ResourceCategory"""
    
    @staticmethod
    def serialize(category):
        return {
            'id': str(category.id),
            'clinic_id': str(category.clinic_id),
            'name': category.name,
            'description': category.description,
            'parent_category_id': str(category.parent_category_id) if category.parent_category_id else None,
            'display_order': category.display_order,
            'is_active': category.is_active,
            'created_at': category.created_at.isoformat() if category.created_at else None,
            'workspace_id': str(category.workspace_id) if category.workspace_id else None
        }


def get_medical_resources_catalog_real(request):
    """
    Get medical resources catalog from REAL medical_resources table
    CORRECTED to use actual database structure
    """
    try:
        # Filter by clinic_id - using DUAL SYSTEM logic would go here
        resources = MedicalResource.objects.all().order_by('title')
        
        catalog = []
        for resource in resources:
            catalog.append(MedicalResourceSerializer.serialize(resource))
        
        return Response({
            'success': True,
            'resources': catalog,
            'total': len(catalog)
        })

    except Exception as error:
        print(f'❌ Error retrieving medical resources catalog: {error}')
        return Response({
            'success': False,
            'error': str(error)
        }, status=500)


def get_resource_categories_real(request):
    """
    Get resource categories from REAL resource_categories table
    """
    try:
        categories = RealResourceCategory.objects.filter(is_active=True).order_by('display_order', 'name')
        
        catalog = []
        for category in categories:
            catalog.append(RealResourceCategorySerializer.serialize(category))
        
        return Response({
            'success': True,
            'categories': catalog,
            'total': len(catalog)
        })

    except Exception as error:
        print(f'❌ Error retrieving resource categories: {error}')
        return Response({
            'success': False,
            'error': str(error)
        }, status=500)


def create_medical_resource_real(request):
    """
    Create medical resource using REAL schema
    """
    try:
        data = json.loads(request.body)
        
        # Extract required fields
        clinic_id = data.get('clinic_id')
        title = data.get('title')
        
        if not clinic_id or not title:
            return Response({
                'success': False,
                'error': 'clinic_id and title are required'
            }, status=400)

        # Get created_by from request user (should be set by Supabase middleware)
        created_by = getattr(request, 'supabase_user_id', None)
        if not created_by:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=401)

        # Create resource
        resource = MedicalResource.objects.create(
            clinic_id=clinic_id,
            created_by=created_by,
            title=title,
            description=data.get('description'),
            content=data.get('content'),
            resource_type=data.get('resource_type'),
            category=data.get('category'),
            tags=data.get('tags', []),
            file_url=data.get('file_url'),
            file_size=data.get('file_size'),
            file_type=data.get('file_type'),
            thumbnail_url=data.get('thumbnail_url'),
            is_public=data.get('is_public', False),
            is_template=data.get('is_template', False),
            metadata=data.get('metadata', {})
        )

        return Response({
            'success': True,
            'resource': MedicalResourceSerializer.serialize(resource),
            'message': 'Medical resource created successfully'
        }, status=201)

    except Exception as error:
        print(f'❌ Error creating medical resource: {error}')
        return Response({
            'success': False,
            'error': str(error)
        }, status=500)


def get_resource_by_id_real(request, resource_id):
    """
    Get specific medical resource by ID
    """
    try:
        resource = MedicalResource.objects.get(id=resource_id)
        
        return Response({
            'success': True,
            'resource': MedicalResourceSerializer.serialize(resource)
        })

    except MedicalResource.DoesNotExist:
        return Response({
            'success': False,
            'error': f'Medical resource {resource_id} not found'
        }, status=404)
    except Exception as error:
        print(f'❌ Error retrieving medical resource: {error}')
        return Response({
            'success': False,
            'error': str(error)
        }, status=500)


def update_resource_download_count(request, resource_id):
    """
    Update download count for a resource
    """
    try:
        resource = MedicalResource.objects.get(id=resource_id)
        
        # Increment download count
        current_count = resource.download_count or 0
        resource.download_count = current_count + 1
        resource.save(update_fields=['download_count'])
        
        return Response({
            'success': True,
            'resource': MedicalResourceSerializer.serialize(resource),
            'message': 'Download count updated'
        })

    except MedicalResource.DoesNotExist:
        return Response({
            'success': False,
            'error': f'Medical resource {resource_id} not found'
        }, status=404)
    except Exception as error:
        print(f'❌ Error updating download count: {error}')
        return Response({
            'success': False,
            'error': str(error)
        }, status=500)


def search_medical_resources_real(request):
    """
    Search medical resources using REAL schema
    """
    try:
        query = request.GET.get('q', '')
        category = request.GET.get('category')
        resource_type = request.GET.get('type')
        is_public = request.GET.get('public')
        
        # Base query
        resources = MedicalResource.objects.all()
        
        # Apply filters
        if query:
            resources = resources.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(content__icontains=query)
            )
        
        if category:
            resources = resources.filter(category=category)
            
        if resource_type:
            resources = resources.filter(resource_type=resource_type)
            
        if is_public is not None:
            resources = resources.filter(is_public=is_public.lower() == 'true')
        
        # Order results
        resources = resources.order_by('title')[:50]  # Limit results
        
        catalog = []
        for resource in resources:
            catalog.append(MedicalResourceSerializer.serialize(resource))
        
        return Response({
            'success': True,
            'resources': catalog,
            'total': len(catalog),
            'query': query
        })

    except Exception as error:
        print(f'❌ Error searching medical resources: {error}')
        return Response({
            'success': False,
            'error': str(error)
        }, status=500)


def get_resources_stats_real(request):
    """
    Get resources statistics from REAL tables
    """
    try:
        # Basic stats
        total_resources = MedicalResource.objects.count()
        public_resources = MedicalResource.objects.filter(is_public=True).count()
        template_resources = MedicalResource.objects.filter(is_template=True).count()
        
        # Resources by type
        type_counts = {}
        for resource in MedicalResource.objects.exclude(resource_type__isnull=True).exclude(resource_type=''):
            resource_type = resource.resource_type
            type_counts[resource_type] = type_counts.get(resource_type, 0) + 1
        
        # Resources by category
        category_counts = {}
        for resource in MedicalResource.objects.exclude(category__isnull=True).exclude(category=''):
            category = resource.category
            category_counts[category] = category_counts.get(category, 0) + 1
        
        stats = {
            'total_resources': total_resources,
            'public_resources': public_resources,
            'private_resources': total_resources - public_resources,
            'template_resources': template_resources,
            'resources_by_type': type_counts,
            'resources_by_category': category_counts,
            'total_categories': RealResourceCategory.objects.filter(is_active=True).count()
        }
        
        return Response({
            'success': True,
            'stats': stats
        })

    except Exception as error:
        print(f'❌ Error getting resources stats: {error}')
        return Response({
            'success': False,
            'error': str(error)
        }, status=500)