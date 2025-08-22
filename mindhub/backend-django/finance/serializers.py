"""
Finance serializers for MindHub Finance API
"""

from rest_framework import serializers
from django.db.models import Sum, Count, Avg
from datetime import datetime, timedelta
from .models import Income, CashRegisterCut, FinancialService, PaymentMethodConfiguration


class IncomeSerializer(serializers.ModelSerializer):
    """
    Serializer for Income model
    """
    patient = serializers.SerializerMethodField()
    consultation = serializers.SerializerMethodField()
    professional = serializers.SerializerMethodField()
    
    class Meta:
        model = Income
        fields = [
            'id', 'patient_id', 'professional_id', 'consultation_id', 'clinic_id',
            'amount', 'currency', 'source', 'payment_method', 'status',
            'description', 'concept', 'notes', 'reference',
            'received_date', 'created_at', 'updated_at',
            'patient_name', 'professional_name',
            'patient', 'consultation', 'professional'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient(self, obj):
        if obj.patient_id and obj.patient_name:
            return {
                'id': str(obj.patient_id),
                'firstName': obj.patient_name.split(' ')[0] if obj.patient_name else '',
                'lastName': ' '.join(obj.patient_name.split(' ')[1:]) if obj.patient_name and len(obj.patient_name.split(' ')) > 1 else '',
                'medicalRecordNumber': f"MRN-{str(obj.patient_id)[:8]}"
            }
        return None

    def get_consultation(self, obj):
        if obj.consultation_id:
            return {
                'id': str(obj.consultation_id),
                'consultationDate': obj.received_date.isoformat(),
                'reason': obj.description or 'Consulta médica'
            }
        return None

    def get_professional(self, obj):
        if obj.professional_id and obj.professional_name:
            return {
                'id': str(obj.professional_id),
                'name': obj.professional_name,
                'email': f"{obj.professional_name.lower().replace(' ', '.')}@mindhub.com"
            }
        return None


class IncomeCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Income records
    """
    class Meta:
        model = Income
        fields = [
            'patient_id', 'professional_id', 'consultation_id', 'clinic_id',
            'amount', 'currency', 'source', 'payment_method', 'status',
            'description', 'concept', 'notes', 'reference',
            'received_date', 'patient_name', 'professional_name'
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class CashRegisterCutSerializer(serializers.ModelSerializer):
    """
    Serializer for Cash Register Cuts
    """
    class Meta:
        model = CashRegisterCut
        fields = '__all__'
        read_only_fields = ['id', 'difference', 'created_at', 'updated_at']


class FinancialServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Financial Services catalog
    """
    class Meta:
        model = FinancialService
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentMethodConfigSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment Method Configuration
    """
    class Meta:
        model = PaymentMethodConfiguration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class FinancialStatsSerializer(serializers.Serializer):
    """
    Serializer for financial statistics
    """
    summary = serializers.DictField()
    breakdown = serializers.DictField()
    trends = serializers.DictField()
    
    def to_representation(self, instance):
        # instance is expected to be a dictionary with stats data
        return instance


class IncomeStatsQuerySerializer(serializers.Serializer):
    """
    Serializer for income statistics query parameters
    """
    period = serializers.ChoiceField(
        choices=['week', 'month', 'year'], 
        default='month',
        required=False
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    clinic_id = serializers.UUIDField(required=False)
    professional_id = serializers.UUIDField(required=False)
    
    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError("start_date must be before end_date")
        return data


class IncomeListQuerySerializer(serializers.Serializer):
    """
    Serializer for income list query parameters
    """
    limit = serializers.IntegerField(min_value=1, max_value=100, default=20, required=False)
    offset = serializers.IntegerField(min_value=0, default=0, required=False)
    status = serializers.ChoiceField(
        choices=['pending', 'confirmed', 'cancelled', 'refunded'],
        required=False
    )
    source = serializers.ChoiceField(
        choices=['consultation', 'advance', 'therapy', 'evaluation', 'procedure', 'medication', 'other'],
        required=False
    )
    payment_method = serializers.ChoiceField(
        choices=['cash', 'credit_card', 'debit_card', 'transfer', 'payment_gateway', 'check', 'insurance'],
        required=False
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    clinic_id = serializers.UUIDField(required=False)
    professional_id = serializers.UUIDField(required=False)
    patient_id = serializers.UUIDField(required=False)


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics
    """
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_transactions = serializers.IntegerField()
    average_transaction = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    week_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    month_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Breakdown data
    income_by_source = serializers.DictField()
    income_by_payment_method = serializers.DictField()
    income_by_professional = serializers.DictField()
    
    # Trends
    daily_trends = serializers.ListField()
    weekly_trends = serializers.ListField()
    monthly_trends = serializers.ListField()