from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, MedicalProfile


class MedicalProfileInline(admin.StackedInline):
    """Inline for medical profile in user admin"""
    model = MedicalProfile
    can_delete = False
    verbose_name_plural = 'Perfil Médico'
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('date_of_birth', 'mobile_phone', 'city')
        }),
        ('Información Profesional', {
            'fields': (
                'profession_type', 
                'professional_id', 
                'specialty_id', 
                'work_environment',
                'institution_name'
            )
        }),
        ('Descubrimiento', {
            'fields': ('discovery_source', 'discovery_other')
        }),
        ('Configuraciones', {
            'fields': ('theme_preference', 'default_landing_page')
        }),
        ('Consentimientos', {
            'fields': ('data_processing_consent', 'marketing_consent')
        }),
        ('Estado de Verificación', {
            'fields': (
                'profile_complete', 
                'credentials_verified', 
                'verification_date',
                'verification_notes'
            )
        })
    )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom user admin with medical profile"""
    inlines = (MedicalProfileInline,)
    
    list_display = (
        'email', 
        'first_name', 
        'last_name', 
        'user_type',
        'is_verified',
        'is_active'
    )
    
    list_filter = (
        'user_type',
        'is_verified', 
        'is_active',
        'is_staff',
        'specialization'
    )
    
    search_fields = ('email', 'first_name', 'last_name', 'professional_license')
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información Profesional', {
            'fields': (
                'user_type',
                'specialization', 
                'professional_license',
                'institution',
                'phone',
                'bio'
            )
        }),
        ('Preferencias', {
            'fields': ('preferred_language', 'timezone')
        }),
        ('Permisos Especiales', {
            'fields': (
                'is_verified',
                'can_create_assessments',
                'can_view_all_results'
            )
        })
    )


@admin.register(MedicalProfile)
class MedicalProfileAdmin(admin.ModelAdmin):
    """Admin for medical profiles"""
    list_display = (
        'user',
        'profession_type',
        'professional_id',
        'profile_complete',
        'credentials_verified',
        'created_at'
    )
    
    list_filter = (
        'profile_complete',
        'credentials_verified',
        'work_environment',
        'discovery_source',
        'theme_preference'
    )
    
    search_fields = (
        'user__email',
        'user__first_name', 
        'user__last_name',
        'professional_id',
        'specialty_id'
    )
    
    readonly_fields = ('profile_complete', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Información Personal', {
            'fields': ('date_of_birth', 'mobile_phone', 'city')
        }),
        ('Información Profesional', {
            'fields': (
                'profession_type', 
                'professional_id', 
                'specialty_id', 
                'work_environment',
                'institution_name'
            )
        }),
        ('Descubrimiento', {
            'fields': ('discovery_source', 'discovery_other')
        }),
        ('Configuraciones', {
            'fields': ('theme_preference', 'default_landing_page')
        }),
        ('Consentimientos', {
            'fields': ('data_processing_consent', 'marketing_consent')
        }),
        ('Estado de Verificación', {
            'fields': (
                'profile_complete', 
                'credentials_verified', 
                'verification_date',
                'verification_notes'
            )
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_as_verified', 'mark_as_unverified']
    
    def mark_as_verified(self, request, queryset):
        """Mark selected profiles as verified"""
        from django.utils import timezone
        queryset.update(
            credentials_verified=True, 
            verification_date=timezone.now()
        )
        self.message_user(request, f"{queryset.count()} perfiles marcados como verificados.")
    mark_as_verified.short_description = "Marcar como verificado"
    
    def mark_as_unverified(self, request, queryset):
        """Mark selected profiles as unverified"""
        queryset.update(
            credentials_verified=False, 
            verification_date=None
        )
        self.message_user(request, f"{queryset.count()} perfiles marcados como no verificados.")
    mark_as_unverified.short_description = "Marcar como no verificado"
