"""
Analytics Views - Healthcare Indicators System
REST API ViewSets for KPI calculations and dashboard
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
import uuid

from .models import (
    IndicatorDefinition,
    IndicatorValue,
    PatientClassification,
    SatisfactionSurvey,
    PrescriptionRefill,
    ClinicalProtocolEvaluation,
    IndicatorSettings
)
from .serializers import (
    IndicatorDefinitionSerializer,
    IndicatorValueSerializer,
    PatientClassificationSerializer,
    SatisfactionSurveySerializer,
    PrescriptionRefillSerializer,
    ClinicalProtocolEvaluationSerializer,
    IndicatorSettingsSerializer,
    DashboardIndicatorSerializer,
    IndicatorCalculationRequestSerializer,
    PatientClassificationUpdateSerializer
)
from .services.calculators import (
    PatientGrowthCalculator,
    ClinicalProtocolComplianceCalculator,
    AbandonmentRateCalculator,
    ClinicalNotesComplianceCalculator,
    PatientClassificationService,
    SatisfactionCalculator
)


class IndicatorDefinitionViewSet(viewsets.ModelViewSet):
    """ViewSet for indicator definitions"""
    
    queryset = IndicatorDefinition.objects.all()
    serializer_class = IndicatorDefinitionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter active indicators"""
        return IndicatorDefinition.objects.filter(is_active=True).order_by('category', 'name')
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all indicator categories"""
        categories = IndicatorDefinition.objects.values_list('category', flat=True).distinct()
        return Response({'categories': list(categories)})


class IndicatorValueViewSet(viewsets.ModelViewSet):
    """ViewSet for indicator calculated values"""
    
    queryset = IndicatorValue.objects.all()
    serializer_class = IndicatorValueSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by clinic or workspace"""
        queryset = IndicatorValue.objects.select_related('indicator')
        
        clinic_id = self.request.query_params.get('clinic_id')
        workspace_id = self.request.query_params.get('workspace_id')
        
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
        elif workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
            
        return queryset.order_by('-period_start', 'indicator__category')
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate indicators for specified period"""
        serializer = IndicatorCalculationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        indicator_ids = data.get('indicator_ids', [])
        
        # Default to current month if no period specified
        if not data.get('period_start'):
            today = timezone.now().date()
            period_start = today.replace(day=1)
        else:
            period_start = data['period_start']
            
        if not data.get('period_end'):
            # End of current month
            if period_start.month == 12:
                period_end = period_start.replace(year=period_start.year + 1, month=1) - timedelta(days=1)
            else:
                period_end = period_start.replace(month=period_start.month + 1) - timedelta(days=1)
        else:
            period_end = data['period_end']
        
        # Get indicators to calculate
        indicators_query = IndicatorDefinition.objects.filter(is_active=True)
        if indicator_ids:
            indicators_query = indicators_query.filter(id__in=indicator_ids)
        
        results = []
        calculators = self._get_calculators()
        
        for indicator in indicators_query:
            try:
                calculator = calculators.get(indicator.name.lower())
                if calculator:
                    value = calculator.calculate(
                        clinic_id=clinic_id,
                        workspace_id=workspace_id,
                        period_start=period_start,
                        period_end=period_end
                    )
                    
                    # Save or update indicator value
                    indicator_value, created = IndicatorValue.objects.update_or_create(
                        indicator=indicator,
                        clinic_id=clinic_id,
                        workspace_id=workspace_id,
                        period_start=period_start,
                        period_end=period_end,
                        defaults={
                            'calculated_value': value['value'],
                            'raw_data': value.get('raw_data', {}),
                            'status': 'calculated',
                            'calculated_at': timezone.now()
                        }
                    )
                    
                    results.append({
                        'indicator': indicator.name,
                        'value': value['value'],
                        'created': created,
                        'status': 'success'
                    })
                else:
                    results.append({
                        'indicator': indicator.name,
                        'status': 'error',
                        'message': 'Calculator not found'
                    })
                    
            except Exception as e:
                results.append({
                    'indicator': indicator.name,
                    'status': 'error',
                    'message': str(e)
                })
        
        return Response({
            'period_start': period_start,
            'period_end': period_end,
            'results': results
        })
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard indicators with trend analysis"""
        clinic_id = request.query_params.get('clinic_id')
        workspace_id = request.query_params.get('workspace_id')
        
        if not (clinic_id or workspace_id):
            return Response(
                {'error': 'Must specify clinic_id or workspace_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get latest values for each indicator
        filter_kwargs = {'clinic_id': clinic_id} if clinic_id else {'workspace_id': workspace_id}
        
        latest_values = IndicatorValue.objects.filter(
            **filter_kwargs,
            status='calculated'
        ).select_related('indicator').order_by('indicator', '-period_start').distinct('indicator')
        
        dashboard_data = []
        for value in latest_values:
            # Calculate trend (simplified)
            trend = self._calculate_trend(value, filter_kwargs)
            achievement_percentage = (value.calculated_value / value.indicator.target_value) * 100 if value.indicator.target_value else 0
            
            dashboard_data.append({
                'id': value.indicator.id,
                'name': value.indicator.name,
                'category': value.indicator.category,
                'current_value': value.calculated_value,
                'target_value': value.indicator.target_value,
                'achievement_percentage': achievement_percentage,
                'trend': trend,
                'period_start': value.period_start,
                'period_end': value.period_end,
                'status': value.status
            })
        
        serializer = DashboardIndicatorSerializer(dashboard_data, many=True)
        return Response(serializer.data)
    
    def _get_calculators(self):
        """Get available calculators"""
        return {
            'crecimiento de pacientes': PatientGrowthCalculator(),
            'cumplimiento de protocolos clínicos': ClinicalProtocolComplianceCalculator(),
            'tasa de abandono terapéutico': AbandonmentRateCalculator(),
            'cumplimiento de notas clínicas': ClinicalNotesComplianceCalculator(),
            'satisfacción del paciente': SatisfactionCalculator()
        }
    
    def _calculate_trend(self, current_value, filter_kwargs):
        """Calculate trend compared to previous period"""
        try:
            # Get previous period value
            previous_value = IndicatorValue.objects.filter(
                **filter_kwargs,
                indicator=current_value.indicator,
                period_start__lt=current_value.period_start,
                status='calculated'
            ).order_by('-period_start').first()
            
            if not previous_value:
                return 'stable'
            
            if current_value.calculated_value > previous_value.calculated_value:
                return 'up'
            elif current_value.calculated_value < previous_value.calculated_value:
                return 'down'
            else:
                return 'stable'
                
        except Exception:
            return 'stable'


class PatientClassificationViewSet(viewsets.ModelViewSet):
    """ViewSet for patient classifications"""
    
    queryset = PatientClassification.objects.all()
    serializer_class = PatientClassificationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def update_classifications(self, request):
        """Update patient classifications"""
        serializer = PatientClassificationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        patient_ids = data.get('patient_ids', [])
        force_recalculate = data.get('force_recalculate', False)
        
        classification_service = PatientClassificationService()
        
        if patient_ids:
            results = []
            for patient_id in patient_ids:
                try:
                    classification = classification_service.classify_patient(
                        patient_id=patient_id,
                        force_recalculate=force_recalculate
                    )
                    results.append({
                        'patient_id': patient_id,
                        'classification': classification['classification'],
                        'status': 'success'
                    })
                except Exception as e:
                    results.append({
                        'patient_id': patient_id,
                        'status': 'error',
                        'message': str(e)
                    })
            
            return Response({'results': results})
        else:
            # Update all patient classifications (background task recommended)
            return Response({
                'message': 'Bulk classification update initiated',
                'status': 'processing'
            })


class SatisfactionSurveyViewSet(viewsets.ModelViewSet):
    """ViewSet for satisfaction surveys"""
    
    queryset = SatisfactionSurvey.objects.all()
    serializer_class = SatisfactionSurveySerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get satisfaction statistics"""
        from django.db.models import Avg, Count
        
        stats = SatisfactionSurvey.objects.aggregate(
            average_score=Avg('score'),
            total_surveys=Count('id')
        )
        
        # Statistics by type
        by_type = SatisfactionSurvey.objects.values('survey_type').annotate(
            average_score=Avg('score'),
            count=Count('id')
        )
        
        return Response({
            'overall': stats,
            'by_type': list(by_type)
        })


class PrescriptionRefillViewSet(viewsets.ModelViewSet):
    """ViewSet for prescription refills"""
    
    queryset = PrescriptionRefill.objects.all()
    serializer_class = PrescriptionRefillSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by date range if provided"""
        queryset = PrescriptionRefill.objects.all()
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(refill_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(refill_date__lte=end_date)
            
        return queryset.order_by('-refill_date')


class ClinicalProtocolEvaluationViewSet(viewsets.ModelViewSet):
    """ViewSet for clinical protocol evaluations"""
    
    queryset = ClinicalProtocolEvaluation.objects.all()
    serializer_class = ClinicalProtocolEvaluationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def compliance_stats(self, request):
        """Get protocol compliance statistics"""
        from django.db.models import Count, Q
        
        stats = ClinicalProtocolEvaluation.objects.aggregate(
            total_evaluations=Count('id'),
            compliant=Count('id', filter=Q(protocol_compliance=True)),
            non_compliant=Count('id', filter=Q(protocol_compliance=False))
        )
        
        compliance_rate = (stats['compliant'] / stats['total_evaluations'] * 100) if stats['total_evaluations'] else 0
        
        return Response({
            'total_evaluations': stats['total_evaluations'],
            'compliant': stats['compliant'],
            'non_compliant': stats['non_compliant'],
            'compliance_rate': compliance_rate
        })


class IndicatorSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for indicator settings"""
    
    queryset = IndicatorSettings.objects.all()
    serializer_class = IndicatorSettingsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by clinic or workspace"""
        queryset = IndicatorSettings.objects.all()
        
        clinic_id = self.request.query_params.get('clinic_id')
        workspace_id = self.request.query_params.get('workspace_id')
        
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
        elif workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
            
        return queryset
