"""
Clinic Serializers - Django REST Framework
Handles clinic registration, team management, and invitations
"""

from rest_framework import serializers
from .models import Clinic, ClinicInvitation, ClinicProfile


class ClinicSerializer(serializers.ModelSerializer):
    """Clinic serializer for API responses"""
    current_users_count = serializers.IntegerField(read_only=True)
    current_patients_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Clinic
        fields = [
            'id', 'name', 'legal_name', 'rfc', 'license_number',
            'address', 'city', 'state', 'postal_code', 'phone', 'email', 'website',
            'subscription_plan', 'max_users', 'max_patients',
            'current_users_count', 'current_patients_count',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ClinicCreateSerializer(serializers.ModelSerializer):
    """Clinic creation serializer with validation"""
    
    class Meta:
        model = Clinic
        fields = [
            'name', 'legal_name', 'rfc', 'license_number',
            'address', 'city', 'state', 'postal_code', 'phone', 'email', 'website',
            'subscription_plan'
        ]

    def validate_rfc(self, value):
        if value and Clinic.objects.filter(rfc=value).exists():
            raise serializers.ValidationError("Ya existe una clínica con este RFC.")
        return value

    def validate_name(self, value):
        if Clinic.objects.filter(name=value).exists():
            raise serializers.ValidationError("Ya existe una clínica con este nombre.")
        return value


class ClinicInvitationSerializer(serializers.ModelSerializer):
    """Clinic invitation serializer"""
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    invited_by_email = serializers.SerializerMethodField()
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ClinicInvitation
        fields = [
            'id', 'clinic_id', 'clinic_name', 'email', 'role', 'token',
            'invited_by_email', 'expires_at', 'is_used', 'is_valid',
            'created_at', 'used_at'
        ]
        read_only_fields = ['id', 'token', 'invited_by', 'used_at', 'created_at']

    def get_invited_by_email(self, obj):
        # This would need to be fetched from Supabase auth.users
        return "admin@clinic.com"  # Placeholder


class ClinicInvitationCreateSerializer(serializers.ModelSerializer):
    """Create new clinic invitation"""
    
    class Meta:
        model = ClinicInvitation
        fields = ['email', 'role']

    def validate_email(self, value):
        clinic_id = self.context.get('clinic_id')
        if ClinicInvitation.objects.filter(
            clinic_id=clinic_id, 
            email=value, 
            is_used=False
        ).exists():
            raise serializers.ValidationError("Ya hay una invitación pendiente para este email.")
        return value


class ClinicProfileSerializer(serializers.ModelSerializer):
    """Clinic profile serializer - matches profiles table structure"""
    clinic_name = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ClinicProfile
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name', 'role',
            'avatar_url', 'phone', 'specialty', 'license_number',
            'clinic_id', 'clinic_role', 'clinic_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_clinic_name(self, obj):
        """Get clinic name from clinic relationship"""
        if obj.clinic:
            return obj.clinic.name
        return None


class ClinicTeamSerializer(serializers.ModelSerializer):
    """Team member summary for clinic management"""
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ClinicProfile
        fields = [
            'id', 'email', 'full_name', 'clinic_role', 'specialty',
            'license_number', 'is_active', 'created_at'
        ]


class ClinicStatsSerializer(serializers.Serializer):
    """Clinic statistics"""
    total_patients = serializers.IntegerField()
    total_team_members = serializers.IntegerField()
    total_consultations = serializers.IntegerField()
    consultations_this_month = serializers.IntegerField()
    active_invitations = serializers.IntegerField()
    subscription_usage = serializers.DictField()