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
    list_filter = ('category', 'is_active', 'is_public', 'is_featured')
    search_fields = ('name', 'abbreviation', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'name', 'abbreviation', 'category', 'subcategory', 'description')
        }),
        ('Autoría y Publicación', {
            'fields': ('authors', 'year', 'version', 'language')
        }),
        ('Características', {
            'fields': ('administration_mode', 'total_items', 'estimated_duration_minutes')
        }),
        ('Población y Rango', {
            'fields': ('target_population', 'score_range_min', 'score_range_max')
        }),
        ('Datos Técnicos', {
            'fields': ('psychometric_properties', 'clinical_validation')
        }),
        ('Tags y Categorización', {
            'fields': ('tags',)
        }),
        ('Configuración', {
            'fields': ('is_active', 'is_public', 'is_featured', 'template_id')
        }),
        ('Fechas', {
            'fields': ('last_validated', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
