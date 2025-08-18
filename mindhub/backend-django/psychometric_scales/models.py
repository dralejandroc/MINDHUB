"""
Psychometric scales models for ClinimetrixPro
Migrated and enhanced from original Streamlit version
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class ScaleCategory(models.Model):
    """
    Categories for organizing psychometric scales
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#1E40AF")  # Hex color
    icon = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Categoría de escala')
        verbose_name_plural = _('Categorías de escalas')
        db_table = 'clinimetrix_scale_categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ScaleTag(models.Model):
    """
    Tags for categorizing and filtering scales
    """
    class TagType(models.TextChoices):
        DIAGNOSTIC = 'diagnostic', _('Diagnóstico')
        POPULATION = 'population', _('Población')
        DOMAIN = 'domain', _('Dominio')
        SPECIALTY = 'specialty', _('Especialidad')
        CUSTOM = 'custom', _('Personalizado')
    
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=50, unique=True)
    tag_type = models.CharField(
        max_length=20,
        choices=TagType.choices,
        default=TagType.CUSTOM
    )
    color = models.CharField(
        max_length=7, 
        default="#6B7280",
        help_text="Color hex para el tag"
    )
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Usuario que creó el tag"
    )
    is_system = models.BooleanField(
        default=False,
        help_text="Tag del sistema (no editable por usuarios)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Tag de escala')
        verbose_name_plural = _('Tags de escalas')
        db_table = 'clinimetrix_scale_tags'
        ordering = ['tag_type', 'name']
        indexes = [
            models.Index(fields=['tag_type']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_tag_type_display()})"


class PsychometricScale(models.Model):
    """
    Main model for psychometric scales
    Stores metadata and references to JSON files
    """
    
    class ApplicationType(models.TextChoices):
        AUTO = 'auto', _('Autoaplicada')
        HETERO = 'hetero', _('Heteroaplicada')
        BOTH = 'both', _('Ambas')
    
    class PopulationType(models.TextChoices):
        ADULT = 'adult', _('Adultos')
        ADOLESCENT = 'adolescent', _('Adolescentes')
        CHILD = 'child', _('Niños')
        ELDERLY = 'elderly', _('Adultos mayores')
        ALL = 'all', _('Todas las edades')
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    abbreviation = models.CharField(max_length=20, unique=True)
    
    # Classification
    category = models.ForeignKey(
        ScaleCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scales'
    )
    
    # Authors and Publication
    authors = models.JSONField(default=list)  # List of author names
    year = models.PositiveIntegerField()
    
    # Description and Usage
    description = models.TextField()
    indication = models.TextField(help_text="Indicaciones clínicas de uso")
    population = models.CharField(
        max_length=20,
        choices=PopulationType.choices,
        default=PopulationType.ADULT
    )
    
    application_type = models.CharField(
        max_length=10,
        choices=ApplicationType.choices,
        default=ApplicationType.AUTO
    )
    
    # Timing and Structure
    estimated_duration_minutes = models.PositiveIntegerField(default=10)
    total_items = models.PositiveIntegerField()
    
    # File References
    json_file_path = models.CharField(max_length=255)  # Path to JSON file
    
    # Psychometric Properties
    reliability_alpha = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text="Cronbach's Alpha"
    )
    
    sensitivity = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    
    specificity = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    
    test_retest_reliability = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    
    # Usage and Status
    is_active = models.BooleanField(default=True)
    is_validated = models.BooleanField(default=False)
    requires_training = models.CharField(
        max_length=20,
        choices=[
            ('minimal', 'Mínimo'),
            ('moderate', 'Moderado'),
            ('high', 'Alto'),
            ('very_high', 'Muy alto')
        ],
        default='minimal'
    )
    
    # Copyright and Licensing
    copyright_info = models.TextField(blank=True)
    license_required = models.BooleanField(default=False)
    
    # Scientific References
    primary_reference = models.TextField(blank=True)
    additional_references = models.JSONField(default=list)
    
    # Tags
    tags = models.ManyToManyField(
        ScaleTag,
        blank=True,
        related_name='scales',
        help_text="Tags para categorizar y filtrar la escala"
    )
    
    # Usage Statistics
    usage_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Escala psicométrica')
        verbose_name_plural = _('Escalas psicométricas')
        db_table = 'clinimetrix_scales'
        ordering = ['name']
        indexes = [
            models.Index(fields=['abbreviation']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.abbreviation} - {self.name}"
    
    def get_full_name(self):
        """Get the full scale name with abbreviation"""
        return f"{self.name} ({self.abbreviation})"
    
    def increment_usage(self):
        """Increment usage counter"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])