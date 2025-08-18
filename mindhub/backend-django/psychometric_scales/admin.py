from django.contrib import admin
from .models import PsychometricScale, ScaleCategory, ScaleTag


@admin.register(ScaleCategory)
class ScaleCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at',)


@admin.register(ScaleTag)
class ScaleTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'tag_type', 'color', 'is_system', 'created_by', 'created_at')
    list_filter = ('tag_type', 'is_system', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PsychometricScale)
class PsychometricScaleAdmin(admin.ModelAdmin):
    list_display = ('abbreviation', 'name', 'category', 'total_items', 'estimated_duration_minutes', 'is_active')
    list_filter = ('category', 'population', 'application_type', 'is_active', 'is_validated', 'tags')
    search_fields = ('name', 'abbreviation', 'description')
    filter_horizontal = ('tags',)
    readonly_fields = ('id', 'usage_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'abbreviation', 'category', 'description', 'indication')
        }),
        ('Autoría y Publicación', {
            'fields': ('authors', 'year', 'primary_reference', 'additional_references')
        }),
        ('Características', {
            'fields': ('population', 'application_type', 'total_items', 'estimated_duration_minutes')
        }),
        ('Archivo JSON', {
            'fields': ('json_file_path',)
        }),
        ('Propiedades Psicométricas', {
            'fields': ('reliability_alpha', 'sensitivity', 'specificity', 'test_retest_reliability')
        }),
        ('Tags y Categorización', {
            'fields': ('tags',)
        }),
        ('Configuración', {
            'fields': ('is_active', 'is_validated', 'requires_training')
        }),
        ('Legal', {
            'fields': ('copyright_info', 'license_required')
        }),
        ('Estadísticas', {
            'fields': ('usage_count',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
