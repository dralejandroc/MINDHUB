"""
ARQUITECTURA ULTRA-SIMPLIFICADA - Expedix Views
Solo filtra por user_id del JWT - elimina toda la complejidad
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
from django.db import models
import logging

from .models import Patient, Consultation, Prescription  
from .serializers import PatientSerializer, PatientCreateSerializer, ConsultationSerializer, PrescriptionSerializer

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class SimplePatientViewSet(viewsets.ModelViewSet):
    """
    ULTRA-SIMPLIFIED: Solo filtra por user_id del JWT
    Elimina toda la complejidad de clinic_id, workspace_id, dual systems
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Solo retorna pacientes del user autenticado"""
        user_id = self.request.user_id
        return Patient.objects.filter(user_id=user_id)
    
    def create(self, request):
        """Crear paciente asociado al user autenticado - ARQUITECTURA SIMPLIFICADA"""
        data = request.data.copy()
        data['user_id'] = request.user_id
        
        # Usar el create serializer para validación apropiada
        serializer = PatientCreateSerializer(data=data)
        if serializer.is_valid():
            patient = serializer.save()
            logger.info(f'✅ [SIMPLIFIED] Patient created: {patient.id} by {request.user_email}')
            
            # Retornar con el serializer de lectura
            response_serializer = PatientSerializer(patient)
            return Response({
                'success': True,
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        logger.error(f'❌ [SIMPLIFIED] Patient creation failed: {serializer.errors}')
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def list(self, request):
        """Listar pacientes con búsqueda simple"""
        queryset = self.get_queryset()
        
        # Búsqueda simple por nombre
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(paternal_last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'total': queryset.count()
        })


class SimpleConsultationViewSet(viewsets.ModelViewSet):
    """Consultas ultra-simplificadas"""
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Solo consultas de pacientes del user"""
        user_id = self.request.user_id
        return Consultation.objects.filter(patient__user_id=user_id)
    
    def create(self, request):
        """Crear consulta"""
        patient_id = request.data.get('patient_id')
        
        # Verificar que el paciente pertenece al user
        try:
            patient = Patient.objects.get(id=patient_id, user_id=request.user_id)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=404)
        
        data = request.data.copy()
        data['patient'] = patient.id
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            consultation = serializer.save()
            return Response(serializer.data, status=201)
        
        return Response(serializer.errors, status=400)


class SimplePrescriptionViewSet(viewsets.ModelViewSet):
    """Recetas ultra-simplificadas"""
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Solo recetas de pacientes del user"""
        user_id = self.request.user_id
        return Prescription.objects.filter(patient__user_id=user_id)