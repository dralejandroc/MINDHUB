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
    patient_id = serializers.UUIDField(required=False, allow_null=True)
    scale_name = serializers.CharField(source='scale.name', read_only=True)
    scale_abbreviation = serializers.CharField(source='scale.abbreviation', read_only=True)
    template_id = serializers.CharField(required=False, allow_null=True)
    scoring_result = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'patient', 'patient_id', 'template_id', 'scale_name', 'scale_abbreviation',
            'administrator_id', 'consultation_id', 'mode', 'status', 
            'responses', 'scores', 'total_score', 'severity_level', 'interpretation',
            'subscale_scores', 'validity_indicators', 'current_step', 'completion_time_seconds',
            'metadata', 'notes', 'clinical_notes', 'observations',
            'started_at', 'completed_at', 'assessment_date',
            'percentile', 'completion_percentage', 'time_taken_minutes',
            'progress_percentage', 'scoring_result',
            'clinic_id', 'user_id', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'started_at', 'completed_at', 'scoring_result', 
            'created_at', 'updated_at', 'progress_percentage'
        ]
    
    def get_progress_percentage(self, obj):
        return obj.progress_percentage
    
    def get_scoring_result(self, obj):
        """Get scoring result from assessment scores"""
        if obj.scores or obj.total_score:
            return {
                'total_score': float(obj.total_score) if obj.total_score else None,
                'subscale_scores': obj.subscale_scores or {},
                'interpretation_label': obj.interpretation.get('label', '') if obj.interpretation else '',
                'severity_level': obj.severity_level or '',
                'percentile': obj.percentile,
                'is_valid': True
            }
        return None
    
    def validate(self, data):
        """Validate simplified system constraints"""
        clinic_id = data.get('clinic_id')
        user_id = data.get('user_id')
        
        # Ensure user_id is provided for individual records
        if not clinic_id and not user_id:
            raise serializers.ValidationError(
                "user_id must be provided for individual assessments."
            )
        
        return data


class AssessmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    patient_name = serializers.SerializerMethodField()
    scale_name = serializers.CharField(source='scale.name', read_only=True)
    scale_abbreviation = serializers.CharField(source='scale.abbreviation', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    interpretation = serializers.SerializerMethodField()
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'patient_id', 'patient_name', 'template_id', 'scale_name', 'scale_abbreviation',
            'status', 'progress_percentage', 'score', 'interpretation',
            'created_at', 'completed_at', 'current_step', 'completion_percentage',
            'total_score', 'severity_level', 'clinic_id', 'user_id'
        ]
    
    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.get_full_name()
        return 'Unknown Patient'
    
    def get_progress_percentage(self, obj):
        return obj.progress_percentage
    
    def get_score(self, obj):
        return float(obj.total_score) if obj.total_score else None
    
    def get_interpretation(self, obj):
        if obj.interpretation:
            return obj.interpretation.get('label', '')
        return ''