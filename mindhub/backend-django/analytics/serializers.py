"""
Analytics Serializers - Healthcare Indicators System
DRF serializers for KPI calculations and patient classification
"""

from rest_framework import serializers
from .models import (
    IndicatorDefinition, 
    IndicatorValue,
    PatientClassification,
    SatisfactionSurvey,
    PrescriptionRefill,
    ClinicalProtocolEvaluation,
    IndicatorSettings
)


class IndicatorDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for indicator definitions"""
    
    class Meta:
        model = IndicatorDefinition
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class IndicatorValueSerializer(serializers.ModelSerializer):
    """Serializer for indicator calculated values"""
    
    indicator_name = serializers.CharField(source='indicator.name', read_only=True)
    target_value = serializers.FloatField(source='indicator.target_value', read_only=True)
    
    class Meta:
        model = IndicatorValue
        fields = '__all__'
        read_only_fields = ['id', 'calculated_at', 'created_at', 'updated_at']
        
    def validate(self, data):
        """Validate clinic_id XOR workspace_id"""
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        
        if bool(clinic_id) == bool(workspace_id):
            raise serializers.ValidationError(
                "Must specify either clinic_id OR workspace_id, not both or neither"
            )
        return data


class PatientClassificationSerializer(serializers.ModelSerializer):
    """Serializer for patient classifications"""
    
    classification_display = serializers.CharField(source='get_classification_display', read_only=True)
    
    class Meta:
        model = PatientClassification
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SatisfactionSurveySerializer(serializers.ModelSerializer):
    """Serializer for satisfaction surveys"""
    
    survey_type_display = serializers.CharField(source='get_survey_type_display', read_only=True)
    
    class Meta:
        model = SatisfactionSurvey
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class PrescriptionRefillSerializer(serializers.ModelSerializer):
    """Serializer for prescription refills"""
    
    refill_type_display = serializers.CharField(source='get_refill_type_display', read_only=True)
    
    class Meta:
        model = PrescriptionRefill
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class ClinicalProtocolEvaluationSerializer(serializers.ModelSerializer):
    """Serializer for clinical protocol evaluations"""
    
    patient_improvement_display = serializers.CharField(source='get_patient_improvement_display', read_only=True)
    
    class Meta:
        model = ClinicalProtocolEvaluation
        fields = '__all__'
        read_only_fields = ['id', 'evaluated_at', 'created_at']


class IndicatorSettingsSerializer(serializers.ModelSerializer):
    """Serializer for indicator settings"""
    
    class Meta:
        model = IndicatorSettings
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def validate(self, data):
        """Validate clinic_id XOR workspace_id"""
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        
        if bool(clinic_id) == bool(workspace_id):
            raise serializers.ValidationError(
                "Must specify either clinic_id OR workspace_id, not both or neither"
            )
        return data


class DashboardIndicatorSerializer(serializers.Serializer):
    """Custom serializer for dashboard indicator display"""
    
    id = serializers.UUIDField()
    name = serializers.CharField()
    category = serializers.CharField()
    current_value = serializers.FloatField()
    target_value = serializers.FloatField()
    achievement_percentage = serializers.FloatField()
    trend = serializers.CharField()  # 'up', 'down', 'stable'
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    status = serializers.CharField()


class IndicatorCalculationRequestSerializer(serializers.Serializer):
    """Serializer for indicator calculation requests"""
    
    indicator_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="List of indicator IDs to calculate. If empty, calculates all active indicators."
    )
    clinic_id = serializers.UUIDField(required=False)
    workspace_id = serializers.UUIDField(required=False)
    period_start = serializers.DateField(required=False)
    period_end = serializers.DateField(required=False)
    
    def validate(self, data):
        """Validate request parameters"""
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        
        if bool(clinic_id) == bool(workspace_id):
            raise serializers.ValidationError(
                "Must specify either clinic_id OR workspace_id, not both or neither"
            )
        return data


class PatientClassificationUpdateSerializer(serializers.Serializer):
    """Serializer for updating patient classifications"""
    
    patient_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="List of patient IDs to classify. If empty, classifies all patients."
    )
    force_recalculate = serializers.BooleanField(
        default=False,
        help_text="Force recalculation even if recently updated"
    )