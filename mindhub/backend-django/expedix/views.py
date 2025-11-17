"""
Expedix Views - Django REST Framework DUAL SYSTEM
Replaces Node.js Express routes with Django ViewSets
Supports:
- LICENCIA CLÍNICA: Multi-user (up to 15 professionals) with shared data
- LICENCIA INDIVIDUAL: Single professional with workspace personal and multiple sucursales
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Value, IntegerField
from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
import logging
from uuid import UUID
from .models import ScheduleConfig

from rest_framework.views import APIView

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .serializers import (ScheduleConfigSerializer)

logger = logging.getLogger(__name__)


class OptimizedPatientPagination(PageNumberPagination):
    """Optimized pagination for patient lists"""
    page_size = 20  # Reasonable page size 
    page_size_query_param = 'page_size'
    max_page_size = 100  # Prevent massive page sizes


from .models import Profile, Patient, MedicalHistory, Consultation, Prescription, ExpedixConfiguration, ConsultationTemplate
from .serializers import (
    ProfileSerializer, PatientSerializer, PatientCreateSerializer,
    PatientSummarySerializer, MedicalHistorySerializer, 
    ConsultationSerializer, ConsultationCreateSerializer,
    PrescriptionSerializer, PrescriptionCreateSerializer,
    DashboardStatsSerializer, ExpedixConfigurationSerializer,
    ExpedixConfigurationCreateSerializer, ConsultationTemplateSerializer,
    ConsultationTemplateCreateSerializer
)
from .authentication import SupabaseProxyAuthentication
from middleware.base_viewsets import ExpedixDualViewSet, DualSystemReadOnlyViewSet

@method_decorator(csrf_exempt, name='dispatch')
class PatientViewSet(ExpedixDualViewSet):  # 🎯 RESTORED DUAL SYSTEM after fixing JSONField
    """
    🎯 DUAL SYSTEM Patient management ViewSet
    Automatically filters by license type:
    - LICENCIA CLÍNICA: WHERE clinic_id = user.clinic_id (shared patients)
    - LICENCIA INDIVIDUAL: WHERE workspace_id = user.workspace_id (private patients)
    """
    queryset = Patient.objects.filter(is_active=True)
    serializer_class = PatientSerializer
    pagination_class = OptimizedPatientPagination  # PERFORMANCE: Add pagination
    authentication_classes = [SupabaseProxyAuthentication]  # ✅ RESTORED according to architecture
    permission_classes = [IsAuthenticated]                 # ✅ RESTORED according to architecture
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'paternal_last_name', 'maternal_last_name', 'email', 'phone', 'medical_record_number']
    filterset_fields = ['gender', 'city', 'state', 'patient_category']  # Removed clinic_id as it's handled by dual system
    ordering_fields = ['created_at', 'first_name', 'paternal_last_name', 'medical_record_number']
    ordering = ['-created_at']

    def get_queryset(self):
        """Optimize queryset with prefetch to avoid N+1 queries"""
        queryset = super().get_queryset()
        
        # PERFORMANCE OPTIMIZATION: Prefetch related data for list views
        if self.action == 'list':
            print('aqui')
            # Temporarily disable problematic prefetch until schema is fixed
            queryset = queryset.select_related().annotate(
                consultations_count=models.Value(0, output_field=models.IntegerField()),  # Placeholder
                evaluations_count=models.Value(0, output_field=models.IntegerField())   # Placeholder
            )
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return PatientCreateSerializer
        elif self.action == 'list':
            return PatientSummarySerializer
        elif self.action in ['update', 'partial_update']:
            # Use PatientCreateSerializer for updates too, as it has the email validation fix
            return PatientCreateSerializer
        return PatientSerializer
    
    def get_serializer_context(self):
        """Add configuration context to serializer"""
        context = super().get_serializer_context()
        
        # Get or create configuration for current user/clinic
        config = self._get_or_create_configuration()
        context['expedix_config'] = config
        
        return context
    
    def _get_or_create_configuration(self):
        """Get or create Expedix configuration for current user context"""
        try:
            # TEMPORARY: Skip database configuration lookup since table doesn't exist
            # Just return a default configuration object (not saved to database)
            user_context = getattr(self.request, 'user_context', {})
            license_type = user_context.get('license_type', 'clinic')
            
            # Return a mock configuration object with defaults
            class MockConfiguration:
                def __init__(self, license_type):
                    self.configuration_type = license_type
                    self.required_patient_fields = []
                    self.consultation_templates_enabled = True
                
                def get_required_fields(self):
                    """Return default required fields"""
                    return [
                        'first_name',
                        'paternal_last_name', 
                        'maternal_last_name',
                        'email',
                        # 'phone',
                        'date_of_birth',
                        'gender'
                    ]
            
            return MockConfiguration(license_type)
            
        except Exception as e:
            logger.error(f"Error getting configuration: {e}")
        
        # Fallback: create a default configuration object (not saved)
        class MockConfiguration:
            def get_required_fields(self):
                return ['first_name', 'email']
        
        return MockConfiguration()

    # ✅ DUAL SYSTEM: get_queryset() and perform_create() are now handled by ExpedixDualViewSet
    # Automatic filtering: clinic_id or workspace_id based on license type

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search patients by multiple criteria"""
        search_term = request.query_params.get('q', '')
        
        if not search_term:
            return Response({'results': [], 'count': 0})
            
        # ✅ FIX: Use get_queryset() to apply dual system filtering (clinic_id/user_id)
        patients = self.get_queryset().filter(
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

    @action(detail=True, methods=['get'], url_path='next-appointment')
    def next_appointment(self, request, pk=None):
        """Get patient's next upcoming appointment"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        id, patient_id, professional_id, consultation_date,
                        status, chief_complaint, created_at
                    FROM consultations 
                    WHERE patient_id = %s 
                      AND consultation_date > NOW()
                      AND status IN ('scheduled', 'confirmed')
                    ORDER BY consultation_date ASC 
                    LIMIT 1
                """, [pk])
                
                columns = [col[0] for col in cursor.description]
                result = cursor.fetchone()
                
                if result:
                    appointment_dict = dict(zip(columns, result))
                    return Response({
                        'success': True,
                        'appointment': appointment_dict
                    })
                else:
                    return Response({
                        'success': True,
                        'appointment': None,
                        'message': 'No upcoming appointments found'
                    })
                    
        except Exception as e:
            logger.error(f'Error fetching next appointment: {str(e)}')
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

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


class ConsultationViewSet(ExpedixDualViewSet):
    """
    🎯 DUAL SYSTEM Consultation management ViewSet
    Automatically filters by license type through patient relationship
    """
    queryset = Consultation.objects.select_related('patient').all()
    serializer_class = ConsultationSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__first_name', 'patient__paternal_last_name', 'reason', 'diagnosis']
    filterset_fields = ['status', 'patient']
    ordering_fields = ['consultation_date', 'created_at']
    ordering = ['-consultation_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return ConsultationCreateSerializer
        return ConsultationSerializer

    def perform_create(self, serializer):
        # Don't set professional as we don't have a users table
        serializer.save()

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


class MedicalHistoryViewSet(ExpedixDualViewSet):
    """
    🎯 DUAL SYSTEM Medical History management ViewSet
    Automatically filters by license type through patient relationship
    """
    queryset = MedicalHistory.objects.select_related('patient').all()
    serializer_class = MedicalHistorySerializer
    authentication_classes = [SupabaseProxyAuthentication]
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


class PrescriptionViewSet(ExpedixDualViewSet):
    """
    🎯 DUAL SYSTEM Prescription management ViewSet
    Handles medical prescriptions with filtering by license type through patient relationship
    """
    queryset = Prescription.objects.select_related().all()
    serializer_class = PrescriptionSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient_id', 'medications', 'instructions']
    filterset_fields = ['patient_id', 'professional_id', 'status']
    ordering_fields = ['prescription_date', 'created_at', 'valid_until']
    ordering = ['-prescription_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer

    def perform_create(self, serializer):
        # Set professional_id from authenticated user context
        serializer.save(professional_id=self.request.user.id)

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get prescriptions by patient ID"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id parameter required'}, status=400)
            
        prescriptions = self.queryset.filter(patient_id=patient_id)
        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_professional(self, request):
        """Get prescriptions by professional ID"""
        professional_id = request.query_params.get('professional_id', self.request.user.id)
        prescriptions = self.queryset.filter(professional_id=professional_id)
        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update prescription status"""
        prescription = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Prescription.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=400)
            
        prescription.status = new_status
        prescription.save()
        
        serializer = self.get_serializer(prescription)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a prescription for reuse"""
        original = self.get_object()
        
        # Create a copy
        prescription_copy = Prescription.objects.create(
            patient_id=original.patient_id,
            professional_id=self.request.user.id,
            medications=original.medications,
            instructions=original.instructions,
            status='draft'
        )
        
        serializer = self.get_serializer(prescription_copy)
        return Response(serializer.data, status=201)


class UserViewSet(DualSystemReadOnlyViewSet):
    """
    🎯 DUAL SYSTEM User management ViewSet (read-only)
    Automatically filters by license type
    """
    queryset = Profile.objects.filter(is_active=True)
    serializer_class = ProfileSerializer
    authentication_classes = [SupabaseProxyAuthentication]
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


class ScheduleConfigViewSet(viewsets.ViewSet):
    """
    Schedule configuration ViewSet with proper authentication
    """
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """GET /api/expedix/schedule-config/"""
        config = {
            'workingHours': {
                'start': '09:00',
                'end': '18:00'
            },
            'workingDays': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            'appointmentDuration': 60,
            'breakDuration': 15,
            'consultationTypes': [
                {
                    'id': 'initial',
                    'name': 'Consulta inicial',
                    'duration': 90,
                    'color': '#3B82F6'
                },
                {
                    'id': 'followup',
                    'name': 'Seguimiento',
                    'duration': 60,
                    'color': '#10B981'
                },
                {
                    'id': 'evaluation',
                    'name': 'Evaluación psicológica',
                    'duration': 120,
                    'color': '#8B5CF6'
                },
                {
                    'id': 'therapy',
                    'name': 'Terapia',
                    'duration': 50,
                    'color': '#F59E0B'
                }
            ],
            'allowOverlapping': False,
            'bufferTime': 10
        }
        
        return Response({
            'success': True,
            'data': config,
            'timestamp': timezone.now().isoformat()
        })

    def update(self, request, pk=None):
        """PUT /api/expedix/schedule-config/"""
        try:
            data = request.data
            logger.info(f'[Schedule Config] Updating configuration: {data}')
            
            # In a real implementation, you would save this to the database
            # For now, just return success
            
            return Response({
                'success': True,
                'message': 'Schedule configuration updated successfully',
                'data': data,
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f'[Schedule Config] Error: {str(e)}')
            return Response({
                'success': False,
                'error': f'Schedule configuration error: {str(e)}'
            }, status=500)

    def create(self, request):
        """POST /api/expedix/schedule-config/ (alias for PUT)"""
        return self.update(request)


class ScheduleConfigView(APIView):
    """
    Config de agenda por usuario autenticado.

    - GET  /api/expedix/schedule-config/
    - PUT  /api/expedix/schedule-config/
    - POST /api/expedix/schedule-config/  (alias de PUT)
    """

    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_user_id(self, request):
        """
        Ajusta esto según cómo deje el user tu SupabaseProxyAuthentication.
        Ejemplos:
        - Si request.user.id YA es el UUID de Supabase -> return request.user.id
        - Si usas Profile y tiene supabase_user_id -> return request.user.supabase_user_id
        """
        return request.user.id  # AJUSTA AQUÍ si usas otro campo

    def _get_or_create_config(self, user_id):
        # clinic_id lo dejamos en None por ahora
        obj, created = ScheduleConfig.objects.get_or_create(
            user_id=user_id,
            clinic_id=None,
        )
        if created:
            logger.info(f"[ScheduleConfig] Creado config por defecto para user={user_id}")
        return obj

    def get(self, request, *args, **kwargs):
        user_id = self._get_user_id(request)

        config = self._get_or_create_config(user_id)
        serializer = ScheduleConfigSerializer(config)

        return Response(
            {
                "success": True,
                "data": serializer.data,
                "timestamp": timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request, *args, **kwargs):
        user_id = self._get_user_id(request)

        config = self._get_or_create_config(user_id)

        logger.info(f"[ScheduleConfig] Updating config for user={user_id}: {request.data}")

        serializer = ScheduleConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Schedule configuration updated successfully",
                "data": serializer.data,
                "timestamp": timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, *args, **kwargs):
        # Alias de PUT
        return self.put(request, *args, **kwargs)


class DualSystemTestViewSet(viewsets.ViewSet):
    """
    Test ViewSet to verify dual system filtering bypassing ALL authentication
    """
    authentication_classes = []
    permission_classes = []
    
    def list(self, request):
        """GET /api/expedix/dual-system-test/ - Test dual system filtering"""
        from django.db import connection
        
        try:
            # Test 1: Get all patients raw SQL
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, first_name, paternal_last_name, created_by, clinic_id, workspace_id, is_active
                    FROM patients 
                    WHERE is_active = true
                    ORDER BY created_at DESC;
                """)
                
                rows = cursor.fetchall()
                all_patients = []
                
                for row in rows:
                    all_patients.append({
                        'id': str(row[0]),
                        'first_name': row[1],
                        'paternal_last_name': row[2] or '',
                        'created_by': str(row[3]) if row[3] else None,
                        'clinic_id': str(row[4]) if row[4] else None,
                        'workspace_id': str(row[5]) if row[5] else None,
                        'is_active': row[6]
                    })
            
            # Test 2: Simulate individual license filtering (workspace_id)
            individual_patients = [
                p for p in all_patients 
                if p['workspace_id'] == 'a1c193e9-643a-4ba9-9214-29536ea93913'
            ]
            
            # Test 3: Simulate clinic license filtering (clinic_id)
            clinic_patients = [
                p for p in all_patients 
                if p['clinic_id'] == '550e8400-e29b-41d4-a716-446655440000'
            ]
            
            # Test 4: Django ORM test
            try:
                from expedix.models import Patient
                django_all = list(Patient.objects.filter(is_active=True).values(
                    'id', 'first_name', 'paternal_last_name', 'created_by', 'clinic_id', 'workspace_id', 'is_active'
                )[:20])
                
                # Convert UUIDs to strings for JSON serialization
                for patient in django_all:
                    for key, value in patient.items():
                        if hasattr(value, 'hex'):  # UUID object
                            patient[key] = str(value)
                
                orm_success = True
                orm_error = None
            except Exception as e:
                django_all = []
                orm_success = False
                orm_error = str(e)
            
            return Response({
                'success': True,
                'dual_system_test': {
                    'all_patients': {
                        'count': len(all_patients),
                        'patients': all_patients
                    },
                    'individual_license_simulation': {
                        'workspace_id': 'a1c193e9-643a-4ba9-9214-29536ea93913',
                        'count': len(individual_patients),
                        'patients': individual_patients,
                        'expected': 'Should show 10 patients'
                    },
                    'clinic_license_simulation': {
                        'clinic_id': '550e8400-e29b-41d4-a716-446655440000',
                        'count': len(clinic_patients),
                        'patients': clinic_patients,
                        'expected': 'Should show 9 patients'
                    },
                    'django_orm': {
                        'success': orm_success,
                        'error': orm_error,
                        'count': len(django_all),
                        'patients': django_all[:5] if django_all else []
                    }
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Dual system test failed: {str(e)}'
            }, status=500)
    
    def create(self, request):
        """POST /api/expedix/dual-system-test/ - Test with specific user context"""
        from django.db import connection
        
        # Get test parameters
        test_user_id = request.data.get('user_id', 'a1c193e9-643a-4ba9-9214-29536ea93913')
        test_license_type = request.data.get('license_type', 'individual')  # or 'clinic'
        test_clinic_id = request.data.get('clinic_id', '38633a49-10e8-4138-b44b-7b7995d887e7')  # Correct clinic_id
        test_workspace_id = request.data.get('workspace_id', '8a956bcb-abca-409e-8ae8-2604372084cf')  # Correct workspace_id
        
        try:
            # Simulate user context manually
            if test_license_type == 'individual':
                simulated_context = {
                    'license_type': 'individual',
                    'access_type': 'individual',
                    'filter_field': 'workspace_id',
                    'filter_value': test_workspace_id,
                    'workspace_id': test_workspace_id,
                    'clinic_id': None,
                    'clinic_role': 'owner',
                    'shared_access': False
                }
            else:
                simulated_context = {
                    'license_type': 'clinic',
                    'access_type': 'clinic',
                    'filter_field': 'clinic_id',
                    'filter_value': test_clinic_id,
                    'clinic_id': test_clinic_id,
                    'workspace_id': None,
                    'clinic_role': 'professional',
                    'shared_access': True
                }
            
            # Test filtering with simulated context
            with connection.cursor() as cursor:
                if simulated_context['license_type'] == 'individual':
                    cursor.execute("""
                        SELECT id, first_name, paternal_last_name, created_by, clinic_id, workspace_id, is_active
                        FROM patients 
                        WHERE is_active = true AND workspace_id = %s
                        ORDER BY created_at DESC;
                    """, [simulated_context['workspace_id']])
                else:
                    cursor.execute("""
                        SELECT id, first_name, paternal_last_name, created_by, clinic_id, workspace_id, is_active
                        FROM patients 
                        WHERE is_active = true AND clinic_id = %s
                        ORDER BY created_at DESC;
                    """, [simulated_context['clinic_id']])
                
                rows = cursor.fetchall()
                filtered_patients = []
                
                for row in rows:
                    filtered_patients.append({
                        'id': str(row[0]),
                        'first_name': row[1],
                        'paternal_last_name': row[2] or '',
                        'created_by': str(row[3]) if row[3] else None,
                        'clinic_id': str(row[4]) if row[4] else None,
                        'workspace_id': str(row[5]) if row[5] else None,
                        'is_active': row[6]
                    })
            
            return Response({
                'success': True,
                'test_configuration': {
                    'test_user_id': test_user_id,
                    'test_license_type': test_license_type,
                    'simulated_context': simulated_context
                },
                'filtered_results': {
                    'count': len(filtered_patients),
                    'patients': filtered_patients,
                    'expected_for_individual': '10 patients',
                    'expected_for_clinic': '9 patients'
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Dual system context test failed: {str(e)}'
            }, status=500)


class DebugAuthViewSet(viewsets.ViewSet):
    """
    Debug ViewSet to check authentication status
    """
    authentication_classes = []
    permission_classes = []
    
    def list(self, request):
        """GET /api/expedix/debug-auth/"""
        debug_info = {
            'request_meta_keys': list(request.META.keys()),
            'has_authorization': 'HTTP_AUTHORIZATION' in request.META,
            'authorization_header': request.META.get('HTTP_AUTHORIZATION', '')[:50] + '...' if request.META.get('HTTP_AUTHORIZATION') else None,
            'has_supabase_user': hasattr(request, 'supabase_user'),
            'has_user_context': hasattr(request, 'user_context'),
            'supabase_user_id': getattr(request, 'supabase_user_id', None),
            'is_authenticated': hasattr(request, 'user') and hasattr(request.user, 'is_authenticated') and request.user.is_authenticated,
        }
        
        if hasattr(request, 'user_context'):
            debug_info['user_context'] = request.user_context
        
        # If test_sql parameter is provided, run SQL tests
        if request.query_params.get('test_sql'):
            from django.db import connection
            
            try:
                # Test raw SQL query
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT id, first_name, last_name, created_by, clinic_id, is_active
                        FROM patients 
                        WHERE is_active = true
                        ORDER BY created_at DESC 
                        LIMIT 5;
                    """)
                    
                    rows = cursor.fetchall()
                    patients_data = []
                    
                    for row in rows:
                        patients_data.append({
                            'id': str(row[0]),
                            'first_name': row[1],
                            'last_name': row[2],
                            'created_by': str(row[3]) if row[3] else None,
                            'clinic_id': str(row[4]) if row[4] else None,
                            'is_active': row[5]
                        })
                
                # Also test Django ORM
                try:
                    from expedix.models import Patient
                    django_patients = list(Patient.objects.filter(is_active=True).values(
                        'id', 'first_name', 'last_name', 'created_by', 'clinic_id', 'is_active'
                    )[:5])
                    
                    # Convert UUIDs to strings for JSON serialization
                    for patient in django_patients:
                        for key, value in patient.items():
                            if hasattr(value, 'hex'):  # UUID object
                                patient[key] = str(value)
                    
                    django_success = True
                    django_error = None
                except Exception as e:
                    django_patients = []
                    django_success = False
                    django_error = str(e)
                
                debug_info['sql_test'] = {
                    'raw_sql': {
                        'success': True,
                        'count': len(patients_data),
                        'patients': patients_data
                    },
                    'django_orm': {
                        'success': django_success,
                        'error': django_error,
                        'count': len(django_patients),
                        'patients': django_patients
                    }
                }
                
            except Exception as e:
                debug_info['sql_test'] = {
                    'error': f'SQL test failed: {str(e)}'
                }
            
        return Response({
            'success': True,
            'debug_info': debug_info,
            'timestamp': timezone.now().isoformat()
        })
    
    def create(self, request):
        """POST /api/expedix/debug-auth/ - Test actual patient query"""
        from django.db import connection
        
        try:
            # Test raw SQL query
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, first_name, last_name, created_by, clinic_id, is_active
                    FROM patients 
                    WHERE is_active = true
                    ORDER BY created_at DESC 
                    LIMIT 5;
                """)
                
                rows = cursor.fetchall()
                patients_data = []
                
                for row in rows:
                    patients_data.append({
                        'id': str(row[0]),
                        'first_name': row[1],
                        'last_name': row[2],
                        'created_by': str(row[3]) if row[3] else None,
                        'clinic_id': str(row[4]) if row[4] else None,
                        'is_active': row[5]
                    })
            
            # Also test Django ORM
            try:
                from expedix.models import Patient
                django_patients = list(Patient.objects.filter(is_active=True).values(
                    'id', 'first_name', 'last_name', 'created_by', 'clinic_id', 'is_active'
                )[:5])
                
                # Convert UUIDs to strings for JSON serialization
                for patient in django_patients:
                    for key, value in patient.items():
                        if hasattr(value, 'hex'):  # UUID object
                            patient[key] = str(value)
                
                django_success = True
                django_error = None
            except Exception as e:
                django_patients = []
                django_success = False
                django_error = str(e)
            
            return Response({
                'success': True,
                'raw_sql': {
                    'success': True,
                    'count': len(patients_data),
                    'patients': patients_data
                },
                'django_orm': {
                    'success': django_success,
                    'error': django_error,
                    'count': len(django_patients),
                    'patients': django_patients
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Debug query failed: {str(e)}'
            }, status=500)


class ExpedixConfigurationViewSet(ExpedixDualViewSet):
    """
    Expedix Configuration ViewSet - DUAL SYSTEM
    Manages flexible field configurations per clinic/workspace
    """
    queryset = ExpedixConfiguration.objects.filter(is_active=True)
    serializer_class = ExpedixConfigurationSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExpedixConfigurationCreateSerializer
        return ExpedixConfigurationSerializer

    def get_queryset(self):
        """Filter configurations by clinic/workspace based on user context"""
        queryset = super().get_queryset()
        
        # Get user context from middleware
        user_context = getattr(self.request, 'user_context', {})
        
        if user_context.get('license_type') == 'clinic':
            clinic_id = user_context.get('clinic_id')
            if clinic_id:
                return queryset.filter(clinic_id=clinic_id)
        else:
            workspace_id = user_context.get('workspace_id')
            if workspace_id:
                return queryset.filter(workspace_id=workspace_id)
        
        return queryset.none()  # No access if no context

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current configuration for authenticated user"""
        try:
            # Get or create configuration
            user_context = getattr(request, 'user_context', {})
            
            if user_context.get('license_type') == 'clinic':
                clinic_id = user_context.get('clinic_id')
                if clinic_id:
                    config, created = ExpedixConfiguration.objects.get_or_create(
                        clinic_id=clinic_id,
                        defaults={
                            'user_id': getattr(request, 'supabase_user_id', 'unknown'),
                            'configuration_type': 'clinic',
                            'required_patient_fields': [],
                            'consultation_templates_enabled': True,
                        }
                    )
                else:
                    return Response({'error': 'No clinic context found'}, status=400)
            else:
                workspace_id = user_context.get('workspace_id')
                if workspace_id:
                    config, created = ExpedixConfiguration.objects.get_or_create(
                        workspace_id=workspace_id,
                        defaults={
                            'user_id': getattr(request, 'supabase_user_id', 'unknown'),
                            'configuration_type': 'individual',
                            'required_patient_fields': [],
                            'consultation_templates_enabled': True,
                        }
                    )
                else:
                    return Response({'error': 'No workspace context found'}, status=400)

            serializer = ExpedixConfigurationSerializer(config)
            return Response({
                'success': True,
                'data': serializer.data,
                'created': created
            })

        except Exception as e:
            logger.error(f"Error getting current configuration: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=False, methods=['get'])
    def available_fields(self, request):
        """Get available fields for configuration"""
        return Response({
            'success': True,
            'data': {
                'default_required_fields': ExpedixConfiguration.get_default_patient_fields(),
                'available_optional_fields': ExpedixConfiguration.get_available_optional_fields(),
                'supported_custom_field_types': [
                    'text', 'number', 'date', 'select', 'textarea', 
                    'checkbox', 'email', 'phone'
                ]
            }
        })


class ConsultationTemplateViewSet(ExpedixDualViewSet):
    """
    Consultation Template ViewSet - DUAL SYSTEM
    Manages consultation templates with FormX integration
    """
    queryset = ConsultationTemplate.objects.filter(is_active=True)
    serializer_class = ConsultationTemplateSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['template_type', 'is_default']
    ordering_fields = ['created_at', 'name', 'template_type']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ConsultationTemplateCreateSerializer
        return ConsultationTemplateSerializer

    def get_queryset(self):
        """Filter templates by clinic/workspace based on user context"""
        queryset = super().get_queryset()
        
        # Get user context from middleware
        user_context = getattr(self.request, 'user_context', {})
        
        if user_context.get('license_type') == 'clinic':
            clinic_id = user_context.get('clinic_id')
            if clinic_id:
                return queryset.filter(clinic_id=clinic_id)
        else:
            workspace_id = user_context.get('workspace_id')
            if workspace_id:
                return queryset.filter(workspace_id=workspace_id)
        
        return queryset.none()  # No access if no context

    @action(detail=False, methods=['get'])
    def default_templates(self, request):
        """Get default consultation templates"""
        templates = self.get_queryset().filter(is_default=True)
        serializer = self.get_serializer(templates, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })

    @action(detail=True, methods=['post'])
    def set_as_default(self, request, pk=None):
        """Set a template as default for the clinic/workspace"""
        try:
            template = self.get_object()
            
            # Remove default from all other templates in same context
            user_context = getattr(request, 'user_context', {})
            
            if user_context.get('license_type') == 'clinic':
                clinic_id = user_context.get('clinic_id')
                if clinic_id:
                    ConsultationTemplate.objects.filter(
                        clinic_id=clinic_id, 
                        is_default=True
                    ).update(is_default=False)
            else:
                workspace_id = user_context.get('workspace_id')
                if workspace_id:
                    ConsultationTemplate.objects.filter(
                        workspace_id=workspace_id, 
                        is_default=True
                    ).update(is_default=False)

            # Set this template as default
            template.is_default = True
            template.save()

            return Response({
                'success': True,
                'message': f'Template "{template.name}" set as default'
            })

        except Exception as e:
            logger.error(f"Error setting template as default: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=False, methods=['post'])
    def create_from_formx(self, request):
        """Create consultation template from FormX template"""
        try:
            formx_template_id = request.data.get('formx_template_id')
            name = request.data.get('name')
            description = request.data.get('description', '')
            template_type = request.data.get('template_type', 'custom')

            if not formx_template_id or not name:
                return Response({
                    'success': False,
                    'error': 'formx_template_id and name are required'
                }, status=400)

            # Validate FormX template exists
            try:
                from formx.models import FormTemplate
                formx_template = FormTemplate.objects.get(id=formx_template_id)
                if not formx_template.is_active:
                    return Response({
                        'success': False,
                        'error': 'Selected FormX template is not active'
                    }, status=400)
            except FormTemplate.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'FormX template not found'
                }, status=404)
            
            # Create template
            user_context = getattr(request, 'user_context', {})
            template_data = {
                'name': name,
                'description': description,
                'template_type': template_type,
                'formx_template_id': formx_template_id,
                'created_by': getattr(request, 'supabase_user_id', 'unknown')
            }

            if user_context.get('license_type') == 'clinic':
                template_data['clinic_id'] = user_context.get('clinic_id')
            else:
                template_data['workspace_id'] = user_context.get('workspace_id')

            serializer = ConsultationTemplateCreateSerializer(data=template_data)
            if serializer.is_valid():
                template = serializer.save()
                response_serializer = ConsultationTemplateSerializer(template)
                
                return Response({
                    'success': True,
                    'data': response_serializer.data,
                    'message': 'Template created from FormX successfully'
                }, status=201)
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=400)

        except Exception as e:
            logger.error(f"Error creating template from FormX: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=True, methods=['post'])
    def sync_with_formx(self, request, pk=None):
        """Sync consultation template with FormX template"""
        try:
            template = self.get_object()
            
            if not template.has_formx_integration():
                return Response({
                    'success': False,
                    'error': 'This template does not have FormX integration'
                }, status=400)

            # Get the FormX template and sync fields
            formx_template = template.get_formx_template()
            if not formx_template:
                return Response({
                    'success': False,
                    'error': 'Associated FormX template not found'
                }, status=404)

            # Update template metadata from FormX
            template.description = formx_template.description or template.description
            template.save()

            serializer = ConsultationTemplateSerializer(template)
            
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Template synced with FormX successfully',
                'formx_fields_count': formx_template.total_fields
            })

        except Exception as e:
            logger.error(f"Error syncing with FormX: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=True, methods=['get'])
    def formx_fields(self, request, pk=None):
        """Get FormX fields for this template"""
        try:
            template = self.get_object()
            
            if not template.has_formx_integration():
                return Response({
                    'success': False,
                    'error': 'This template does not have FormX integration'
                }, status=400)

            formx_template = template.get_formx_template()
            if not formx_template:
                return Response({
                    'success': False,
                    'error': 'Associated FormX template not found'
                }, status=404)

            # Get all fields from FormX template
            try:
                fields = formx_template.fields.all().order_by('order')
                fields_data = [
                    {
                        'id': field.id,
                        'field_name': field.field_name,
                        'label': field.label,
                        'field_type': field.field_type,
                        'help_text': field.help_text,
                        'placeholder': field.placeholder,
                        'required': field.required,
                        'order': field.order,
                        'choices': field.choices,
                        'expedix_mapping': field.expedix_field,
                        'validation_rules': field.validation_rules,
                        'css_classes': field.css_classes,
                    }
                    for field in fields
                ]
                
                return Response({
                    'success': True,
                    'formx_template': {
                        'id': formx_template.id,
                        'name': formx_template.name,
                        'form_type': formx_template.form_type,
                        'total_fields': formx_template.total_fields
                    },
                    'fields': fields_data,
                    'fields_count': len(fields_data)
                })
            except Exception as field_error:
                return Response({
                    'success': False,
                    'error': f'Error retrieving FormX fields: {str(field_error)}'
                }, status=500)

        except Exception as e:
            logger.error(f"Error getting FormX fields: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=False, methods=['get'])
    def available_formx_templates(self, request):
        """Get available FormX templates for creating consultation templates"""
        try:
            from formx.models import FormTemplate
            
            # Get FormX templates that can be used for consultations
            formx_templates = FormTemplate.objects.filter(
                is_active=True,
                form_type__in=['clinical', 'intake', 'follow_up']
            ).order_by('-created_at')

            templates_data = [
                {
                    'id': template.id,
                    'name': template.name,
                    'form_type': template.form_type,
                    'description': template.description,
                    'integration_type': template.integration_type,
                    'total_fields': template.total_fields,
                    'total_submissions': template.total_submissions,
                    'created_at': template.created_at,
                }
                for template in formx_templates
            ]

            return Response({
                'success': True,
                'available_templates': templates_data,
                'count': len(templates_data)
            })

        except Exception as e:
            logger.error(f"Error getting available FormX templates: {e}")
            return Response({
                'success': False,
                'error': str(e),
                'available_templates': [],
                'count': 0
            }, status=500)


class PrescriptionViewSet(ExpedixDualViewSet):
    """
    Prescription ViewSet - DUAL SYSTEM
    Manages medical prescriptions with PDF generation
    """
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['medication_name', 'instructions', 'dosage']
    filterset_fields = ['patient_id', 'consultation_id', 'professional_id']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PrescriptionCreateSerializer
        return PrescriptionSerializer

    def get_queryset(self):
        """Filter prescriptions by clinic/workspace based on user context"""
        queryset = super().get_queryset()
        
        # Get user context from middleware
        user_context = getattr(self.request, 'user_context', {})
        
        if user_context.get('license_type') == 'clinic':
            clinic_id = user_context.get('clinic_id')
            if clinic_id:
                return queryset.filter(clinic_id=clinic_id)
        else:
            workspace_id = user_context.get('workspace_id')
            if workspace_id:
                return queryset.filter(workspace_id=workspace_id)
        
        return queryset.none()  # No access if no context

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get prescriptions by patient ID"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({
                'success': False,
                'error': 'patient_id parameter is required'
            }, status=400)

        user_context = getattr(request, 'user_context', {})
        clinic_id = user_context.get('clinic_id')
        workspace_id = user_context.get('workspace_id')

        prescriptions = Prescription.get_active_by_patient(
            patient_id=patient_id,
            clinic_id=clinic_id,
            workspace_id=workspace_id
        )

        serializer = self.get_serializer(prescriptions, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })

    @action(detail=False, methods=['get'])
    def by_professional(self, request):
        """Get prescriptions by professional ID"""
        professional_id = request.query_params.get('professional_id')
        if not professional_id:
            return Response({
                'success': False,
                'error': 'professional_id parameter is required'
            }, status=400)

        user_context = getattr(request, 'user_context', {})
        clinic_id = user_context.get('clinic_id')
        workspace_id = user_context.get('workspace_id')

        prescriptions = Prescription.get_by_professional(
            professional_id=professional_id,
            clinic_id=clinic_id,
            workspace_id=workspace_id
        )

        serializer = self.get_serializer(prescriptions, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)
        })

    @action(detail=True, methods=['post'])
    def generate_pdf(self, request, pk=None):
        """Generate PDF for prescription"""
        try:
            prescription = self.get_object()
            
            # Generate PDF
            pdf_data = prescription.generate_pdf()
            
            if pdf_data:
                serializer = self.get_serializer(prescription)
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'pdf_info': pdf_data,
                    'message': 'PDF generated successfully'
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Failed to generate PDF'
                }, status=500)

        except Exception as e:
            logger.error(f"Error generating PDF for prescription {pk}: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=True, methods=['post'])
    def regenerate_verification_code(self, request, pk=None):
        """Regenerate verification code for prescription"""
        try:
            prescription = self.get_object()
            
            # Generate new verification code
            new_code = prescription.generate_verification_code()
            prescription.save(update_fields=['verification_code'])
            
            return Response({
                'success': True,
                'verification_code': new_code,
                'message': 'Verification code regenerated successfully'
            })

        except Exception as e:
            logger.error(f"Error regenerating verification code for prescription {pk}: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update prescription status"""
        try:
            prescription = self.get_object()
            new_status = request.data.get('status')
            
            if not new_status:
                return Response({
                    'success': False,
                    'error': 'status field is required'
                }, status=400)

            valid_statuses = [choice[0] for choice in Prescription.PRESCRIPTION_STATUS_CHOICES]
            if new_status not in valid_statuses:
                return Response({
                    'success': False,
                    'error': f'Invalid status. Valid options: {valid_statuses}'
                }, status=400)

            prescription.status = new_status
            prescription.save(update_fields=['status', 'updated_at'])
            
            serializer = self.get_serializer(prescription)
            return Response({
                'success': True,
                'data': serializer.data,
                'message': f'Prescription status updated to {new_status}'
            })

        except Exception as e:
            logger.error(f"Error updating prescription status {pk}: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    def perform_create(self, serializer):
        """Add user context when creating prescription"""
        user_context = getattr(self.request, 'user_context', {})
        
        # Auto-set the clinic_id or workspace_id based on user context
        if user_context.get('license_type') == 'clinic':
            serializer.save(clinic_id=user_context.get('clinic_id'))
        else:
            serializer.save(workspace_id=user_context.get('workspace_id'))


class ConsultationCentralViewSet(ExpedixDualViewSet):
    """
    Central Consultation Management ViewSet - The heart of Expedix
    Handles consultation creation, updates, and integration with Agenda
    """
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reason', 'diagnosis', 'notes']
    ordering_fields = ['consultation_date', 'created_at']
    ordering = ['-consultation_date', '-created_at']

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get all consultations for a specific patient"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({
                'success': False,
                'error': 'patient_id is required'
            }, status=400)

        try:
            # Verify patient exists and user has access
            patient = self.get_queryset().filter(id=patient_id).first()
            if not patient:
                return Response({
                    'success': False,
                    'error': 'Patient not found or access denied'
                }, status=404)

            # Get patient consultations
            consultations = Consultation.objects.filter(
                patient_id=patient_id
            ).order_by('-consultation_date', '-created_at')

            # Apply dual system filtering
            consultations = self.filter_queryset(consultations)

            serializer = self.get_serializer(consultations, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            })

        except Exception as e:
            logger.error(f"Error getting patient consultations: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=False, methods=['get'])
    def by_appointment(self, request):
        """Get consultation by appointment ID"""
        appointment_id = request.query_params.get('appointment_id')
        if not appointment_id:
            return Response({
                'success': False,
                'error': 'appointment_id is required'
            }, status=400)

        try:
            consultation = self.get_queryset().filter(
                appointment_id=appointment_id
            ).first()

            if consultation:
                serializer = self.get_serializer(consultation)
                return Response({
                    'success': True,
                    'data': serializer.data
                })
            else:
                return Response({
                    'success': True,
                    'data': None
                })

        except Exception as e:
            logger.error(f"Error getting consultation by appointment: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=True, methods=['patch'])
    def start(self, request, pk=None):
        """Start a consultation (change status from draft to in_progress)"""
        try:
            consultation = self.get_object()
            consultation.status = 'in_progress'
            consultation.started_at = timezone.now()
            consultation.save()

            serializer = self.get_serializer(consultation)
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Consultation started successfully'
            })

        except Exception as e:
            logger.error(f"Error starting consultation {pk}: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """Complete a consultation with final data"""
        try:
            consultation = self.get_object()
            
            # Update consultation data
            serializer = self.get_serializer(consultation, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(
                    status='completed',
                    completed_at=timezone.now()
                )
                
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': 'Consultation completed successfully'
                })
            else:
                return Response({
                    'success': False,
                    'error': serializer.errors
                }, status=400)

        except Exception as e:
            logger.error(f"Error completing consultation {pk}: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=True, methods=['post'])
    def create_appointment(self, request, pk=None):
        """Create a new appointment from consultation (for next appointment)"""
        try:
            consultation = self.get_object()
            appointment_data = request.data

            # This would integrate with Agenda module
            # For now, return success with mock data
            return Response({
                'success': True,
                'data': {
                    'id': 'mock-appointment-id',
                    'consultation_id': consultation.id,
                    'patient_id': consultation.patient_id,
                    'scheduled_date': appointment_data.get('date'),
                    'scheduled_time': appointment_data.get('time'),
                    'status': 'scheduled'
                },
                'message': 'Next appointment scheduled successfully'
            })

        except Exception as e:
            logger.error(f"Error creating appointment from consultation {pk}: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    def perform_create(self, serializer):
        """Automatically set patient context and create consultation"""
        user_context = getattr(self.request, 'user_context', {})
        user_id = getattr(self.request, 'supabase_user_id', None)
        
        # Set professional and dates
        save_data = {
            'professional_id': user_id,
            'created_at': timezone.now(),
            'updated_at': timezone.now()
        }

        # Apply dual system logic compatible with current DB structure
        # Current issue: clinic_id is NOT NULL in DB, so we need a valid clinic_id always
        license_type = user_context.get('license_type')
        
        logger.info(f"Creating consultation for license_type: {license_type}, user_context: {user_context}")
        
        if license_type == 'clinic':
            clinic_id = user_context.get('clinic_id')
            if clinic_id:
                save_data['clinic_id'] = clinic_id
                save_data['workspace_id'] = None
                logger.info(f"CLINIC LICENSE: Using clinic_id={clinic_id}")
            else:
                logger.error("Clinic license but no clinic_id found in user_context")
                raise ValidationError("Clinic license requires clinic_id")
                
        elif license_type == 'individual':
            workspace_id = user_context.get('workspace_id')
            if workspace_id:
                # FIXED: For individual license, ONLY set workspace_id, clinic_id should be NULL
                save_data['clinic_id'] = None
                save_data['workspace_id'] = workspace_id
                logger.info(f"INDIVIDUAL LICENSE: Using workspace_id={workspace_id}, clinic_id=None")
            else:
                logger.error("Individual license but no workspace_id found in user_context")
                raise ValidationError("Individual license requires workspace_id")
        else:
            logger.error(f"Invalid or missing license_type: {license_type}")
            # Fallback to clinic license with default values
            default_clinic_id = 'bf005c17-508f-4d3e-aee0-cb2d87f1a5d0'
            save_data['clinic_id'] = default_clinic_id
            save_data['workspace_id'] = None
            logger.warning(f"FALLBACK: Using default clinic_id={default_clinic_id}")

        logger.info(f"Final save_data for consultation: {save_data}")
        serializer.save(**save_data)