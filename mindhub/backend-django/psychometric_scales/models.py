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
    Main model for psychometric scales - SIMPLIFIED to match actual database structure
    Based on clinimetrix_registry table structure from sync_scales_from_json_raw.py
    """
    
    class ApplicationType(models.TextChoices):
        AUTO = 'self', _('Autoaplicada')
        HETERO = 'interviewer', _('Heteroaplicada')
        BOTH = 'both', _('Ambas')
    
    class PopulationType(models.TextChoices):
        ADULT = 'adult', _('Adultos')
        ADOLESCENT = 'adolescent', _('Adolescentes')
        CHILD = 'child', _('Niños')
        ELDERLY = 'elderly', _('Adultos mayores')
        ALL = 'all', _('Todas las edades')
    
    # Core fields that actually exist in clinimetrix_registry
    id = models.TextField(primary_key=True)  # scale_id from sync command
    abbreviation = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, null=True, blank=True)
    subcategory = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(blank=True)
    version = models.CharField(max_length=20, default='1.0')
    language = models.CharField(max_length=10, default='es')
    
    # JSON fields
    authors = models.JSONField(default=list)
    target_population = models.JSONField(default=dict)
    tags = models.JSONField(default=list)
    
    # Integer fields
    year = models.PositiveIntegerField(null=True, blank=True)
    estimated_duration_minutes = models.PositiveIntegerField(default=10)
    total_items = models.PositiveIntegerField(default=0)
    score_range_min = models.IntegerField(default=0)
    score_range_max = models.IntegerField(default=100)
    # usage_count = models.PositiveIntegerField(default=0)  # COMMENTED: Field doesn't exist in DB
    
    # Administration mode
    administration_mode = models.CharField(
        max_length=20,
        choices=ApplicationType.choices,
        default=ApplicationType.AUTO
    )
    
    # Status flags
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    # is_validated = models.BooleanField(default=False)  # DOESN'T EXIST IN DB
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # COMPATIBILITY PROPERTIES for existing code
    @property 
    def application_type(self):
        return self.administration_mode
    
    @property
    def population(self):
        return self.PopulationType.ADULT  # Default fallback
    
    @property
    def json_file_path(self):
        """Generate JSON file path for scale data"""
        return f"scales/{self.abbreviation.lower()}-json.json"
    
    @property
    def requires_training(self):
        return False  # Default value since field doesn't exist in DB
    
    @property
    def reliability_alpha(self):
        return None
    
    @property
    def sensitivity(self):
        return None
    
    @property
    def specificity(self):
        return None
    
    @property
    def test_retest_reliability(self):
        return None
    
    class Meta:
        verbose_name = _('Escala psicométrica')
        verbose_name_plural = _('Escalas psicométricas')
        db_table = 'clinimetrix_registry'
        ordering = ['name']
        indexes = [
            models.Index(fields=['abbreviation']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
        managed = False  # Don't let Django manage this table structure
    
    def __str__(self):
        return f"{self.abbreviation} - {self.name}"
    
    def get_full_name(self):
        """Get the full scale name with abbreviation"""
        return f"{self.name} ({self.abbreviation})"
    
    def get_population_display(self):
        """Compatibility method for population display"""
        return "Todas las edades"
    
    def get_application_type_display(self):
        """Compatibility method for application type display"""
        return self.get_administration_mode_display()
    
    def increment_usage(self):
        """Increment usage counter - DISABLED: usage_count field doesn't exist in DB"""
        # self.usage_count += 1
        # self.save(update_fields=['usage_count'])
        pass  # TODO: Implement usage tracking if needed