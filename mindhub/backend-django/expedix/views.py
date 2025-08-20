"""
Expedix Views - Django REST Framework
Replaces Node.js Express routes with Django ViewSets
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta

from .models import User, Patient, MedicalHistory, Consultation
from .serializers import (
    UserSerializer, PatientSerializer, PatientCreateSerializer,
    PatientSummarySerializer, MedicalHistorySerializer, 
    ConsultationSerializer, ConsultationCreateSerializer,
    DashboardStatsSerializer
)


class PatientViewSet(viewsets.ModelViewSet):
    """
    Patient management ViewSet
    Replaces /api/expedix/patients/* endpoints from Node.js
    """
    queryset = Patient.objects.select_related('created_by').filter(is_active=True)
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'paternal_last_name', 'maternal_last_name', 'email', 'phone']
    filterset_fields = ['gender', 'city', 'state', 'created_by']
    ordering_fields = ['created_at', 'first_name', 'paternal_last_name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PatientCreateSerializer
        elif self.action == 'list':
            return PatientSummarySerializer
        return PatientSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search patients by multiple criteria"""
        search_term = request.query_params.get('q', '')
        
        if not search_term:
            return Response({'results': [], 'count': 0})
            
        patients = self.queryset.filter(
            Q(first_name__icontains=search_term) |
            Q(paternal_last_name__icontains=search_term) |
            Q(maternal_last_name__icontains=search_term) |
            Q(email__icontains=search_term) |
            Q(phone__icontains=search_term)
        )[:10]  # Limit results
        
        serializer = PatientSummarySerializer(patients, many=True)
        return Response({
            'results': serializer.data,
            'count': patients.count()
        })

    @action(detail=True, methods=['get'])
    def medical_history(self, request, pk=None):
        """Get patient's medical history"""
        patient = self.get_object()
        history = patient.medical_history.all().order_by('-created_at')
        serializer = MedicalHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def consultations(self, request, pk=None):
        """Get patient's consultations"""
        patient = self.get_object()
        consultations = patient.consultations.select_related('professional').order_by('-consultation_date')
        serializer = ConsultationSerializer(consultations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Dashboard statistics"""
        total_patients = Patient.objects.filter(is_active=True).count()
        active_patients = Patient.objects.filter(
            is_active=True,
            consultations__consultation_date__gte=timezone.now() - timedelta(days=30)
        ).distinct().count()
        
        total_consultations = Consultation.objects.count()
        consultations_this_month = Consultation.objects.filter(
            consultation_date__gte=timezone.now().replace(day=1)
        ).count()
        
        upcoming_appointments = Consultation.objects.filter(
            consultation_date__gte=timezone.now(),
            status='scheduled'
        ).count()

        stats = {
            'total_patients': total_patients,
            'active_patients': active_patients,
            'total_consultations': total_consultations,
            'consultations_this_month': consultations_this_month,
            'upcoming_appointments': upcoming_appointments
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


class ConsultationViewSet(viewsets.ModelViewSet):
    """
    Consultation management ViewSet
    Replaces /api/expedix/consultations/* endpoints from Node.js
    """
    queryset = Consultation.objects.select_related('patient', 'professional').all()
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__first_name', 'patient__paternal_last_name', 'reason', 'diagnosis']
    filterset_fields = ['status', 'patient', 'professional']
    ordering_fields = ['consultation_date', 'created_at']
    ordering = ['-consultation_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return ConsultationCreateSerializer
        return ConsultationSerializer

    def perform_create(self, serializer):
        serializer.save(professional=self.request.user)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming consultations"""
        upcoming = self.queryset.filter(
            consultation_date__gte=timezone.now(),
            status='scheduled'
        ).order_by('consultation_date')[:10]
        
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get consultations by patient ID"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id parameter required'}, status=400)
            
        consultations = self.queryset.filter(patient_id=patient_id)
        serializer = self.get_serializer(consultations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update consultation status"""
        consultation = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Consultation.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=400)
            
        consultation.status = new_status
        consultation.save()
        
        serializer = self.get_serializer(consultation)
        return Response(serializer.data)


class MedicalHistoryViewSet(viewsets.ModelViewSet):
    """
    Medical History management ViewSet
    """
    queryset = MedicalHistory.objects.select_related('patient').all()
    serializer_class = MedicalHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['condition', 'treatment', 'notes']
    filterset_fields = ['patient', 'status']
    ordering_fields = ['diagnosis_date', 'created_at']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get medical history by patient ID"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id parameter required'}, status=400)
            
        history = self.queryset.filter(patient_id=patient_id)
        serializer = self.get_serializer(history, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    User management ViewSet (read-only for now)
    """
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'organization']
    ordering_fields = ['created_at', 'first_name', 'last_name']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)