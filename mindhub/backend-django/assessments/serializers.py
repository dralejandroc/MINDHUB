"""
Serializers for Clinimetrix assessments API
"""
from rest_framework import serializers
from .models import Assessment, Patient, ScoringResult


class PatientSerializer(serializers.ModelSerializer):
    """Patient serializer for Clinimetrix"""
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'medical_record', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'age', 'gender', 'email', 'phone', 'address',
            'diagnosis', 'medications', 'medical_history', 'notes',
            'consent_given', 'consent_date', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'age']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_age(self, obj):
        return obj.get_age()


class ScoringResultSerializer(serializers.ModelSerializer):
    """Scoring result serializer"""
    
    class Meta:
        model = ScoringResult
        fields = [
            'total_score', 'total_score_raw', 'subscale_scores',
            'interpretation_label', 'severity_level', 'severity_color',
            'clinical_interpretation', 'percentile', 'z_score', 't_score',
            'computed_at', 'is_valid'
        ]


class AssessmentSerializer(serializers.ModelSerializer):
    """Assessment serializer for API responses"""
    patient = PatientSerializer(read_only=True)
    patient_id = serializers.UUIDField(write_only=True)
    scale_name = serializers.CharField(source='scale.name', read_only=True)
    scale_abbreviation = serializers.CharField(source='scale.abbreviation', read_only=True)
    scoring_result = ScoringResultSerializer(read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'patient', 'patient_id', 'scale', 'scale_name', 'scale_abbreviation',
            'mode', 'instructions', 'status', 'started_at', 'completed_at',
            'expires_at', 'duration_minutes', 'current_item', 'total_items',
            'progress_percentage', 'is_valid', 'validity_notes',
            'assessment_reason', 'clinical_context', 'scoring_result',
            'clinic_id', 'workspace_id', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'started_at', 'completed_at', 'duration_minutes',
            'progress_percentage', 'scoring_result', 'created_at', 'updated_at'
        ]
    
    def get_progress_percentage(self, obj):
        return obj.progress_percentage
    
    def validate(self, data):
        """Validate dual system constraints"""
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        
        # Ensure only one of clinic_id or workspace_id is set
        if clinic_id and workspace_id:
            raise serializers.ValidationError(
                "Only one of clinic_id or workspace_id can be set, not both."
            )
        
        return data


class AssessmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    scale_name = serializers.CharField(source='scale.name', read_only=True)
    scale_abbreviation = serializers.CharField(source='scale.abbreviation', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    interpretation = serializers.SerializerMethodField()
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'patient_name', 'scale_name', 'scale_abbreviation',
            'status', 'progress_percentage', 'score', 'interpretation',
            'created_at', 'completed_at', 'current_item', 'total_items'
        ]
    
    def get_progress_percentage(self, obj):
        return obj.progress_percentage
    
    def get_score(self, obj):
        try:
            return obj.scoring_result.total_score
        except:
            return None
    
    def get_interpretation(self, obj):
        try:
            return obj.scoring_result.interpretation_label
        except:
            return None