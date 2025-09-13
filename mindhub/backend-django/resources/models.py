"""
Resources Models - Document Management System
Migrated from Node.js Prisma to Django ORM
"""

import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from django.utils.deconstruct import deconstructible
import os


@deconstructible
class ResourceUploadPath:
    """Generate upload paths for resources"""
    def __init__(self, sub_path):
        self.sub_path = sub_path

    def __call__(self, instance, filename):
        # File will be uploaded to MEDIA_ROOT/resources/<sub_path>/<id>_<filename>
        ext = filename.split('.')[-1]
        filename = f'{instance.id}.{ext}'
        return os.path.join('resources', self.sub_path, filename)


class ResourceCategory(models.Model):
    """Hierarchical categories for resource organization"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    icon = models.CharField(max_length=100, blank=True, null=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resource_categories'
        verbose_name = 'Categoría de Recursos'
        verbose_name_plural = 'Categorías de Recursos'
        indexes = [
            models.Index(fields=['parent']),
            models.Index(fields=['sort_order']),
            models.Index(fields=['is_active']),
        ]
        ordering = ['sort_order', 'name']

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name

    @property
    def full_path(self):
        """Get the full hierarchical path of the category"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return " > ".join(path)


class Resource(models.Model):
    """Main resource/document model"""
    LIBRARY_TYPE_CHOICES = [
        ('public', 'Público'),
        ('private', 'Privado'),
        ('premium', 'Premium'),
    ]

    FILE_TYPE_CHOICES = [
        ('pdf', 'PDF'),
        ('image', 'Imagen'),
        ('document', 'Documento'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Otro'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    
    # File information
    file = models.FileField(
        upload_to=ResourceUploadPath('originals'),
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'mp4', 'mp3'])]
    )
    original_filename = models.CharField(max_length=500)
    file_type = models.CharField(max_length=50, choices=FILE_TYPE_CHOICES)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    
    # Organization
    category = models.ForeignKey(ResourceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='resources')
    library_type = models.CharField(max_length=20, choices=LIBRARY_TYPE_CHOICES, default='private')
    owner = models.ForeignKey('expedix.Profile', on_delete=models.CASCADE, null=True, blank=True, related_name='owned_resources')
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    thumbnail = models.ImageField(upload_to=ResourceUploadPath('thumbnails'), blank=True, null=True)
    content_hash = models.CharField(max_length=64, unique=True, help_text="SHA-256 hash for duplicate detection")
    full_text_content = models.TextField(blank=True, null=True, help_text="Extracted text content for search")
    metadata = models.JSONField(default=dict, blank=True)
    
    # Status and tracking
    is_active = models.BooleanField(default=True)
    upload_by = models.ForeignKey('expedix.Profile', on_delete=models.PROTECT, related_name='uploaded_resources')
    send_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resources'
        indexes = [
            models.Index(fields=['library_type']),
            models.Index(fields=['owner']),
            models.Index(fields=['category']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_active']),
            models.Index(fields=['file_type']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def file_extension(self):
        return self.original_filename.split('.')[-1].lower() if '.' in self.original_filename else ''

    @property
    def formatted_file_size(self):
        """Return human-readable file size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"


class WatermarkTemplate(models.Model):
    """Templates for watermarking resources"""
    TYPE_CHOICES = [
        ('text', 'Texto'),
        ('image', 'Imagen'),
        ('combined', 'Combinado'),
    ]

    POSITION_CHOICES = [
        ('top-left', 'Superior Izquierda'),
        ('top-center', 'Superior Centro'),
        ('top-right', 'Superior Derecha'),
        ('center', 'Centro'),
        ('bottom-left', 'Inferior Izquierda'),
        ('bottom-center', 'Inferior Centro'),
        ('bottom-right', 'Inferior Derecha'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('expedix.Profile', on_delete=models.CASCADE, related_name='watermark_templates')
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Logo/Image watermark
    logo = models.ImageField(upload_to=ResourceUploadPath('watermarks'), blank=True, null=True)
    
    # Text watermark
    text_content = models.CharField(max_length=500, blank=True, null=True)
    
    # Positioning and styling
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default='bottom-right')
    opacity = models.DecimalField(max_digits=3, decimal_places=2, default=0.5)
    font_size = models.IntegerField(default=12)
    font_color = models.CharField(max_length=7, default='#000000')
    
    # Advanced settings
    settings = models.JSONField(default=dict, blank=True)
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'watermark_templates'
        indexes = [
            models.Index(fields=['user', 'is_default']),
        ]

    def __str__(self):
        return f"{self.user.first_name} - {self.name}"


class ResourceEmailTemplate(models.Model):
    """Email templates for sending resources"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('expedix.Profile', on_delete=models.CASCADE, related_name='email_templates')
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=500)
    body_html = models.TextField()
    body_text = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resource_email_templates'
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.first_name} - {self.name}"


class ResourceSend(models.Model):
    """Track resource distribution to patients"""
    SEND_METHOD_CHOICES = [
        ('email', 'Email'),
        ('download', 'Descarga'),
        ('patient-portal', 'Portal del Paciente'),
    ]

    DELIVERY_STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('sent', 'Enviado'),
        ('delivered', 'Entregado'),
        ('failed', 'Fallido'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='sends')
    patient = models.ForeignKey('expedix.Patient', on_delete=models.CASCADE, related_name='resource_sends')
    sent_by = models.ForeignKey('expedix.Profile', on_delete=models.PROTECT)
    
    # Send details
    sent_at = models.DateTimeField(auto_now_add=True)
    send_method = models.CharField(max_length=20, choices=SEND_METHOD_CHOICES)
    email_template = models.ForeignKey(ResourceEmailTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Watermark information
    watermark_applied = models.BooleanField(default=False)
    watermark_template = models.ForeignKey(WatermarkTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Customizations and tracking
    customizations = models.JSONField(default=dict, blank=True)
    delivery_status = models.CharField(max_length=20, choices=DELIVERY_STATUS_CHOICES, default='sent')
    delivered_at = models.DateTimeField(blank=True, null=True)
    viewed_at = models.DateTimeField(blank=True, null=True)
    download_count = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'resource_sends'
        indexes = [
            models.Index(fields=['patient']),
            models.Index(fields=['resource']),
            models.Index(fields=['sent_at']),
            models.Index(fields=['delivery_status']),
        ]
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.resource.title} → {self.patient.full_name}"


class ResourceAccessLog(models.Model):
    """Log resource access for analytics"""
    ACTION_CHOICES = [
        ('view', 'Ver'),
        ('download', 'Descargar'),
        ('print', 'Imprimir'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resource_send = models.ForeignKey(ResourceSend, on_delete=models.CASCADE, related_name='access_logs')
    accessed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)

    class Meta:
        db_table = 'resource_access_logs'
        indexes = [
            models.Index(fields=['resource_send']),
            models.Index(fields=['accessed_at']),
        ]
        ordering = ['-accessed_at']

    def __str__(self):
        return f"{self.action} - {self.resource_send.resource.title} - {self.accessed_at}"


class ResourceCollection(models.Model):
    """Collections for grouping resources"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('expedix.Profile', on_delete=models.CASCADE, related_name='resource_collections')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resource_collections'
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.first_name} - {self.name}"


class ResourceCollectionItem(models.Model):
    """Many-to-many relationship for resource collections"""
    collection = models.ForeignKey(ResourceCollection, on_delete=models.CASCADE, related_name='items')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='collection_items')
    sort_order = models.IntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'resource_collection_items'
        unique_together = ['collection', 'resource']
        ordering = ['sort_order', 'added_at']

    def __str__(self):
        return f"{self.collection.name} - {self.resource.title}"
