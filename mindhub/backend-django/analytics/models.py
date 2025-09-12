"""
Analytics Models - Healthcare Indicators System
Automated KPI calculation and patient classification for MindHub
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta


class IndicatorDefinition(models.Model):
    """
    Definition of healthcare indicators/KPIs
    """
    FREQUENCY_CHOICES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('quarterly', 'Trimestral'),
        ('yearly', 'Anual'),
    ]
    
    INDICATOR_TYPE_CHOICES = [
        ('performance', 'Desempeño'),
        ('result', 'Resultado'),
        ('process', 'Proceso'),
        ('volume', 'Volumen'),
        ('management', 'Gestión'),
    ]
    
    APPLIES_TO_CHOICES = [
        ('individual', 'Usuario Individual'),
        ('clinic', 'Clínica'),
        ('both', 'Ambos'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name="Nombre del Indicador")
    objective = models.TextField(verbose_name="Objetivo del Indicador")
    formula = models.TextField(verbose_name="Fórmula de Cálculo")
    data_source = models.CharField(max_length=300, verbose_name="Fuente de Datos")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    target_value = models.FloatField(verbose_name="Meta", validators=[MinValueValidator(0)])
    indicator_type = models.CharField(max_length=20, choices=INDICATOR_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    applies_to = models.CharField(max_length=20, choices=APPLIES_TO_CHOICES, default='both')
    category = models.CharField(max_length=100, verbose_name="Categoría")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Definición de Indicador"
        verbose_name_plural = "Definiciones de Indicadores"
        ordering = ['category', 'name']
    
    def __str__(self):
        return self.name


class IndicatorValue(models.Model):
    """
    Calculated values for indicators over time
    """
    STATUS_CHOICES = [
        ('calculated', 'Calculado'),
        ('pending', 'Pendiente'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    indicator = models.ForeignKey(IndicatorDefinition, on_delete=models.CASCADE, related_name='values')
    
    # Simplified system: clinic_id (Boolean) and user_id (UUID)
    clinic_id = models.BooleanField(default=False, verbose_name="Compartido en Clínica")
    user_id = models.UUIDField(null=True, blank=True, verbose_name="ID Usuario")
    
    # Time period
    period_start = models.DateField(verbose_name="Inicio del Período")
    period_end = models.DateField(verbose_name="Fin del Período")
    
    # Calculated value and metadata
    calculated_value = models.FloatField(verbose_name="Valor Calculado")
    raw_data = models.JSONField(default=dict, verbose_name="Datos Raw")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    calculated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Valor de Indicador"
        verbose_name_plural = "Valores de Indicadores"
        ordering = ['-period_start', 'indicator__name']
        unique_together = ['indicator', 'clinic_id', 'user_id', 'period_start', 'period_end']
    
    def __str__(self):
        return f"{self.indicator.name}: {self.calculated_value} ({self.period_start})"


class PatientClassification(models.Model):
    """
    Patient classification based on engagement with clinic services
    """
    CLASSIFICATION_CHOICES = [
        ('P_INCONSTANTE', 'P. Inconstante'),
        ('P_EN_ACOMPAÑAMIENTO', 'P. en Acompañamiento'),
        ('INTEGRACION_INICIAL', 'Integración Inicial'),
        ('P_INTEGRACION_AVANZADA', 'P. Integración Avanzada'),
        ('P_INTEGRADO', 'P. Integrado'),
        ('ARRAIGADO', 'Arraigado'),
        ('P_DE_ALTA', 'P. de Alta'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.UUIDField(unique=True, verbose_name="ID Paciente")
    
    # Classification data
    classification = models.CharField(max_length=30, choices=CLASSIFICATION_CHOICES)
    attendance_rate = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    professionals_seen = models.IntegerField(default=0, verbose_name="Profesionales Consultados")
    treatment_adherence = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    time_in_treatment = models.IntegerField(default=0, verbose_name="Días en Tratamiento")
    additional_programs = models.IntegerField(default=0, verbose_name="Programas Adicionales")
    
    # Timestamps
    last_evaluation = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Clasificación de Paciente"
        verbose_name_plural = "Clasificaciones de Pacientes"
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Paciente {self.patient_id}: {self.get_classification_display()}"


class SatisfactionSurvey(models.Model):
    """
    Patient satisfaction surveys
    """
    SURVEY_TYPE_CHOICES = [
        ('medical_attention', 'Atención Médica'),
        ('global', 'Satisfacción Global'),
        ('customer_service', 'Atención al Cliente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.UUIDField(verbose_name="ID Paciente")
    appointment_id = models.UUIDField(null=True, blank=True, verbose_name="ID Cita")
    
    survey_type = models.CharField(max_length=30, choices=SURVEY_TYPE_CHOICES)
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    feedback = models.TextField(blank=True, verbose_name="Comentarios")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Encuesta de Satisfacción"
        verbose_name_plural = "Encuestas de Satisfacción"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Encuesta {self.get_survey_type_display()}: {self.score}/10"


class PrescriptionRefill(models.Model):
    """
    Prescription refills without physical appointment
    Common for controlled medications
    """
    REFILL_TYPE_CHOICES = [
        ('in_person', 'Presencial'),
        ('whatsapp', 'WhatsApp'),
        ('phone', 'Teléfono'),
        ('email', 'Email'),
        ('remote', 'Remoto'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_id = models.UUIDField(verbose_name="ID Paciente")
    prescription_id = models.UUIDField(verbose_name="ID Prescripción")
    
    refill_date = models.DateField(default=timezone.now)
    refill_type = models.CharField(max_length=20, choices=REFILL_TYPE_CHOICES)
    is_controlled_medication = models.BooleanField(default=False)
    notes = models.TextField(blank=True, verbose_name="Notas")
    
    # Professional who handled the refill
    created_by = models.UUIDField(verbose_name="Creado por")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Resurtido de Receta"
        verbose_name_plural = "Resurtidos de Recetas"
        ordering = ['-refill_date']
    
    def __str__(self):
        return f"Resurtido {self.patient_id} - {self.refill_date}"


class ClinicalProtocolEvaluation(models.Model):
    """
    Evaluation of clinical protocol compliance
    Coherence between diagnosis and treatment
    """
    IMPROVEMENT_CHOICES = [
        ('improved', 'Mejorado'),
        ('stable', 'Estable'),
        ('worsened', 'Empeorado'),
        ('unknown', 'Desconocido'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    consultation_id = models.UUIDField(verbose_name="ID Consulta")
    patient_id = models.UUIDField(verbose_name="ID Paciente")
    
    # Clinical data
    diagnosis_code = models.CharField(max_length=20, verbose_name="Código Diagnóstico")
    treatment_plan = models.JSONField(default=dict, verbose_name="Plan de Tratamiento")
    medication_changes = models.JSONField(default=dict, verbose_name="Cambios en Medicación")
    patient_improvement = models.CharField(max_length=20, choices=IMPROVEMENT_CHOICES, default='unknown')
    
    # Evaluation results
    protocol_compliance = models.BooleanField(default=True, verbose_name="Cumplimiento de Protocolo")
    deviation_reason = models.TextField(null=True, blank=True, verbose_name="Razón de Desviación")
    
    # Timestamps
    evaluated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Evaluación de Protocolo Clínico"
        verbose_name_plural = "Evaluaciones de Protocolos Clínicos"
        ordering = ['-evaluated_at']
    
    def __str__(self):
        return f"Evaluación {self.diagnosis_code} - {'✓' if self.protocol_compliance else '✗'}"


class IndicatorSettings(models.Model):
    """
    Personalized settings for indicators per user/clinic
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Simplified system: clinic_id (Boolean) and user_id (UUID)
    clinic_id = models.BooleanField(default=False, verbose_name="Compartido en Clínica")
    user_id = models.UUIDField(null=True, blank=True, verbose_name="ID Usuario")
    
    # Configuration
    enabled_indicators = models.JSONField(default=list, verbose_name="Indicadores Habilitados")
    custom_targets = models.JSONField(default=dict, verbose_name="Metas Personalizadas")
    notification_preferences = models.JSONField(default=dict, verbose_name="Preferencias de Notificación")
    dashboard_layout = models.JSONField(default=dict, verbose_name="Layout del Dashboard")
    clinical_guidelines = models.JSONField(default=dict, verbose_name="Guías Clínicas Personalizadas")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Configuración de Indicadores"
        verbose_name_plural = "Configuraciones de Indicadores"
        unique_together = [['clinic_id', 'user_id']]  # One config per entity
    
    def __str__(self):
        entity = "Clínica" if self.clinic_id else f"Usuario {self.user_id}"
        return f"Config {entity}"
