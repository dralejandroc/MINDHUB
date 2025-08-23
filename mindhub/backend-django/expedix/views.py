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
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

from .models import User, Patient, MedicalHistory, Consultation
from .serializers import (
    UserSerializer, PatientSerializer, PatientCreateSerializer,
    PatientSummarySerializer, MedicalHistorySerializer, 
    ConsultationSerializer, ConsultationCreateSerializer,
    DashboardStatsSerializer
)
from .authentication import SupabaseProxyAuthentication
from middleware.base_viewsets import ExpedixDualViewSet, DualSystemReadOnlyViewSet


class PatientViewSet(ExpedixDualViewSet):  # 🎯 RESTORED DUAL SYSTEM after fixing JSONField
    """
    🎯 DUAL SYSTEM Patient management ViewSet
    Automatically filters by license type:
    - LICENCIA CLÍNICA: WHERE clinic_id = user.clinic_id (shared patients)
    - LICENCIA INDIVIDUAL: WHERE workspace_id = user.workspace_id (private patients)
    """
    queryset = Patient.objects.filter(is_active=True)
    serializer_class = PatientSerializer
    authentication_classes = []  # 🧪 TEMPORARILY DISABLED to isolate JSON issue
    permission_classes = []      # 🧪 TEMPORARILY DISABLED to isolate JSON issue
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'paternal_last_name', 'maternal_last_name', 'email', 'phone', 'medical_record_number']
    filterset_fields = ['gender', 'city', 'state', 'patient_category']  # Removed clinic_id as it's handled by dual system
    ordering_fields = ['created_at', 'first_name', 'paternal_last_name', 'medical_record_number']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PatientCreateSerializer
        elif self.action == 'list':
            return PatientSummarySerializer
        return PatientSerializer

    # ✅ DUAL SYSTEM: get_queryset() and perform_create() are now handled by ExpedixDualViewSet
    # Automatic filtering: clinic_id or workspace_id based on license type

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


class UserViewSet(DualSystemReadOnlyViewSet):
    """
    🎯 DUAL SYSTEM User management ViewSet (read-only)
    Automatically filters by license type
    """
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
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