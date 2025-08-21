"""
Clinic Views - Django REST Framework
Handles clinic registration, team management, and invitations
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
import uuid
import secrets
import logging

from expedix.authentication import SupabaseProxyAuthentication
from .models import Clinic, ClinicInvitation, ClinicProfile
from .serializers import (
    ClinicSerializer, ClinicCreateSerializer, ClinicInvitationSerializer,
    ClinicInvitationCreateSerializer, ClinicProfileSerializer,
    ClinicTeamSerializer, ClinicStatsSerializer
)

logger = logging.getLogger(__name__)


class ClinicViewSet(viewsets.ModelViewSet):
    """
    Clinic management ViewSet
    Handles clinic registration and management
    """
    queryset = Clinic.objects.filter(is_active=True)
    serializer_class = ClinicSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'legal_name', 'rfc', 'city', 'state']
    filterset_fields = ['subscription_plan', 'city', 'state']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ClinicCreateSerializer
        return ClinicSerializer

    def get_queryset(self):
        """Filter clinics based on user permissions"""
        # Users can only see their own clinic
        if hasattr(self.request, 'supabase_user_id'):
            return self.queryset.filter(created_by=self.request.supabase_user_id)
        return self.queryset.none()

    def perform_create(self, serializer):
        """Create clinic with current user as owner"""
        clinic = serializer.save(created_by=self.request.supabase_user_id)
        
        # Update user profile to link to this clinic
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE profiles 
                SET clinic_id = %s, clinic_role = 'clinic_owner', updated_at = NOW()
                WHERE id = %s
            """, [str(clinic.id), self.request.supabase_user_id])
        
        logger.info(f'Created clinic {clinic.name} for user {self.request.authenticated_user_email}')

    @action(detail=True, methods=['get'])
    def team(self, request, pk=None):
        """Get clinic team members"""
        clinic = self.get_object()
        team_members = ClinicProfile.objects.filter(clinic=clinic, is_active=True)
        serializer = ClinicTeamSerializer(team_members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get clinic statistics"""
        clinic = self.get_object()
        
        # Calculate stats
        total_patients = clinic.current_patients_count
        total_team_members = ClinicProfile.objects.filter(clinic=clinic, is_active=True).count()
        
        # Consultations from patients in this clinic
        from expedix.models import Consultation, Patient
        clinic_patients = Patient.objects.filter(clinic_id=clinic.id)
        total_consultations = Consultation.objects.filter(patient__in=clinic_patients).count()
        consultations_this_month = Consultation.objects.filter(
            patient__in=clinic_patients,
            consultation_date__gte=timezone.now().replace(day=1)
        ).count()
        
        active_invitations = ClinicInvitation.objects.filter(
            clinic_id=clinic.id, 
            is_used=False
        ).count()
        
        subscription_usage = {
            'users': f"{total_team_members}/{clinic.max_users}",
            'patients': f"{total_patients}/{clinic.max_patients}",
            'users_percentage': round((total_team_members / clinic.max_users) * 100, 1),
            'patients_percentage': round((total_patients / clinic.max_patients) * 100, 1)
        }
        
        stats = {
            'total_patients': total_patients,
            'total_team_members': total_team_members,
            'total_consultations': total_consultations,
            'consultations_this_month': consultations_this_month,
            'active_invitations': active_invitations,
            'subscription_usage': subscription_usage
        }
        
        serializer = ClinicStatsSerializer(stats)
        return Response(serializer.data)


class ClinicInvitationViewSet(viewsets.ModelViewSet):
    """
    Clinic invitation management ViewSet
    """
    queryset = ClinicInvitation.objects.all()
    serializer_class = ClinicInvitationSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'role', 'clinic']
    ordering_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ClinicInvitationCreateSerializer
        return ClinicInvitationSerializer

    def get_queryset(self):
        """Filter invitations based on user's clinic"""
        # Users can only see invitations for their clinic
        if hasattr(self.request, 'user_clinic_id') and self.request.user_clinic_id:
            return self.queryset.filter(clinic_id=self.request.user_clinic_id)
        return self.queryset.none()

    def perform_create(self, serializer):
        """Create invitation with clinic context"""
        # Generate secure token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(days=7)  # 7 days to accept
        
        invitation = serializer.save(
            clinic_id=self.request.user_clinic_id,
            token=token,
            invited_by=self.request.supabase_user_id,
            expires_at=expires_at
        )
        
        # TODO: Send invitation email
        logger.info(f'Created invitation for {invitation.email} to join {invitation.clinic.name}')

    @action(detail=False, methods=['post'])
    def accept(self, request):
        """Accept clinic invitation"""
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token required'}, status=400)
        
        try:
            invitation = ClinicInvitation.objects.get(token=token)
            
            if not invitation.is_valid():
                return Response({'error': 'Invitation expired or invalid'}, status=400)
            
            # Update user profile to link to this clinic using raw SQL
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE profiles 
                    SET clinic_id = %s, clinic_role = %s, updated_at = NOW()
                    WHERE id = %s
                """, [str(invitation.clinic_id), invitation.role, request.supabase_user_id])
            
            # Mark invitation as used
            invitation.is_used = True
            invitation.used_at = timezone.now()
            invitation.save()
            
            logger.info(f'User {request.authenticated_user_email} joined clinic {invitation.clinic.name}')
            
            return Response({
                'success': True,
                'message': f'Successfully joined {invitation.clinic.name}',
                'clinic': ClinicSerializer(invitation.clinic).data
            })
            
        except ClinicInvitation.DoesNotExist:
            return Response({'error': 'Invalid invitation token'}, status=404)

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """Revoke clinic invitation"""
        invitation = self.get_object()
        invitation.is_used = True  # Mark as used/revoked
        invitation.save()
        
        return Response({'success': True, 'message': 'Invitation revoked'})


class ClinicProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Clinic profile management ViewSet - uses existing profiles table
    """
    queryset = ClinicProfile.objects.filter(clinic_id__isnull=False)  # Only clinic users
    serializer_class = ClinicProfileSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['clinic_role', 'specialty', 'full_name', 'email']
    filterset_fields = ['clinic_id', 'clinic_role']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter profiles based on user's clinic"""
        if hasattr(self.request, 'user_clinic_id') and self.request.user_clinic_id:
            return self.queryset.filter(clinic_id=self.request.user_clinic_id)
        return self.queryset.none()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's clinic profile"""
        try:
            profile = ClinicProfile.objects.get(
                id=request.supabase_user_id
            )
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except ClinicProfile.DoesNotExist:
            return Response({'error': 'No clinic profile found'}, status=404)