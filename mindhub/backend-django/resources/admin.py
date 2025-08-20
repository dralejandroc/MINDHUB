"""
Resources Django Admin Configuration
Provides admin interface for resource management
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ResourceCategory, Resource, WatermarkTemplate, ResourceEmailTemplate,
    ResourceSend, ResourceAccessLog, ResourceCollection, ResourceCollectionItem
)


@admin.register(ResourceCategory)
class ResourceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'full_path', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'full_path', 'created_at', 'updated_at']
    ordering = ['sort_order', 'name']
    
    fieldsets = (
        ('Información de la Categoría', {
            'fields': ('name', 'description', 'parent', 'icon')
        }),
        ('Organización', {
            'fields': ('sort_order', 'is_active')
        }),
        ('Sistema', {
            'fields': ('full_path', 'created_at', 'updated_at')
        })
    )


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'file_type', 'category', 'library_type', 'formatted_file_size',
        'send_count', 'view_count', 'upload_by', 'created_at'
    ]
    list_filter = ['file_type', 'library_type', 'category', 'is_active', 'created_at']
    search_fields = ['title', 'description', 'original_filename', 'tags']
    readonly_fields = [
        'id', 'content_hash', 'file_size', 'mime_type', 'original_filename',
        'formatted_file_size', 'send_count', 'view_count', 'download_count',
        'created_at', 'updated_at'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información del Recurso', {
            'fields': ('title', 'description', 'category', 'library_type', 'owner')
        }),
        ('Archivo', {
            'fields': ('file', 'original_filename', 'file_type', 'file_size', 
                      'formatted_file_size', 'mime_type', 'content_hash')
        }),
        ('Metadata', {
            'fields': ('tags', 'thumbnail', 'full_text_content', 'metadata')
        }),
        ('Estadísticas', {
            'fields': ('send_count', 'view_count', 'download_count')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Sistema', {
            'fields': ('upload_by', 'created_at', 'updated_at')
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'owner', 'upload_by')


@admin.register(WatermarkTemplate)
class WatermarkTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'type', 'position', 'opacity', 'is_default', 'created_at']
    list_filter = ['type', 'position', 'is_default', 'created_at']
    search_fields = ['name', 'text_content']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información de la Marca de Agua', {
            'fields': ('user', 'name', 'type', 'is_default')
        }),
        ('Contenido', {
            'fields': ('logo', 'text_content')
        }),
        ('Estilo y Posición', {
            'fields': ('position', 'opacity', 'font_size', 'font_color')
        }),
        ('Configuración Avanzada', {
            'fields': ('settings',)
        }),
        ('Sistema', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(ResourceEmailTemplate)
class ResourceEmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'subject', 'is_default', 'created_at']
    list_filter = ['is_default', 'created_at']
    search_fields = ['name', 'subject', 'body_html']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información del Template', {
            'fields': ('user', 'name', 'is_default')
        }),
        ('Contenido del Email', {
            'fields': ('subject', 'body_html', 'body_text')
        }),
        ('Sistema', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(ResourceSend)
class ResourceSendAdmin(admin.ModelAdmin):
    list_display = [
        'resource', 'patient', 'sent_by', 'send_method', 'delivery_status',
        'watermark_applied', 'download_count', 'sent_at'
    ]
    list_filter = ['send_method', 'delivery_status', 'watermark_applied', 'sent_at']
    search_fields = [
        'resource__title', 'patient__first_name', 'patient__paternal_last_name'
    ]
    readonly_fields = ['id', 'sent_at', 'download_count']
    ordering = ['-sent_at']
    
    fieldsets = (
        ('Información del Envío', {
            'fields': ('resource', 'patient', 'sent_by', 'send_method')
        }),
        ('Templates y Personalización', {
            'fields': ('email_template', 'watermark_applied', 'watermark_template', 'customizations')
        }),
        ('Estado y Seguimiento', {
            'fields': ('delivery_status', 'delivered_at', 'viewed_at', 'download_count')
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Sistema', {
            'fields': ('sent_at',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('resource', 'patient', 'sent_by')


@admin.register(ResourceAccessLog)
class ResourceAccessLogAdmin(admin.ModelAdmin):
    list_display = ['resource_send', 'action', 'ip_address', 'accessed_at']
    list_filter = ['action', 'accessed_at']
    search_fields = [
        'resource_send__resource__title', 'resource_send__patient__first_name'
    ]
    readonly_fields = ['id', 'accessed_at']
    ordering = ['-accessed_at']
    
    def has_change_permission(self, request, obj=None):
        return False  # Access logs should be read-only
    
    def has_delete_permission(self, request, obj=None):
        return False  # Access logs should be read-only


@admin.register(ResourceCollection)
class ResourceCollectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_public', 'items_count', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'items_count', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información de la Colección', {
            'fields': ('user', 'name', 'description')
        }),
        ('Configuración', {
            'fields': ('is_public',)
        }),
        ('Estadísticas', {
            'fields': ('items_count',)
        }),
        ('Sistema', {
            'fields': ('created_at', 'updated_at')
        })
    )
    
    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Elementos'


class ResourceCollectionItemInline(admin.TabularInline):
    model = ResourceCollectionItem
    extra = 0
    readonly_fields = ['added_at']


# Add inline to ResourceCollectionAdmin
ResourceCollectionAdmin.inlines = [ResourceCollectionItemInline]


@admin.register(ResourceCollectionItem)
class ResourceCollectionItemAdmin(admin.ModelAdmin):
    list_display = ['collection', 'resource', 'sort_order', 'added_at']
    list_filter = ['added_at', 'collection']
    search_fields = ['collection__name', 'resource__title']
    readonly_fields = ['added_at']
    ordering = ['collection', 'sort_order', 'added_at']
