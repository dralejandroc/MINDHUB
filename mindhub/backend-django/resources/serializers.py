"""
Resources Serializers - Django REST Framework
Replaces Node.js API responses with Django serializers
"""

from rest_framework import serializers
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
import hashlib
import mimetypes
from .models import (
    ResourceCategory, Resource, WatermarkTemplate, ResourceEmailTemplate,
    ResourceSend, ResourceAccessLog, ResourceCollection, ResourceCollectionItem
)


class ResourceCategorySerializer(serializers.ModelSerializer):
    """Resource category serializer"""
    full_path = serializers.CharField(read_only=True)
    children_count = serializers.SerializerMethodField()
    resources_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ResourceCategory
        fields = [
            'id', 'name', 'description', 'parent', 'icon', 'sort_order',
            'is_active', 'created_at', 'updated_at', 'full_path',
            'children_count', 'resources_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()

    def get_resources_count(self, obj):
        return obj.resources.filter(is_active=True).count()


class ResourceSerializer(serializers.ModelSerializer):
    """Resource serializer for API responses"""
    category_name = serializers.CharField(source='category.full_path', read_only=True)
    owner_name = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    file_extension = serializers.CharField(read_only=True)
    formatted_file_size = serializers.CharField(read_only=True)
    
    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'file', 'original_filename',
            'file_type', 'file_size', 'mime_type', 'category', 'library_type',
            'owner', 'tags', 'thumbnail', 'content_hash', 'full_text_content',
            'metadata', 'is_active', 'upload_by', 'send_count', 'view_count',
            'download_count', 'created_at', 'updated_at', 'category_name',
            'owner_name', 'uploaded_by_name', 'file_extension', 'formatted_file_size'
        ]
        read_only_fields = [
            'id', 'content_hash', 'file_size', 'mime_type', 'original_filename',
            'created_at', 'updated_at', 'send_count', 'view_count', 'download_count'
        ]

    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return None

    def get_uploaded_by_name(self, obj):
        return f"{obj.upload_by.first_name} {obj.upload_by.last_name}".strip()


class ResourceUploadSerializer(serializers.ModelSerializer):
    """Resource upload serializer with file processing"""
    
    class Meta:
        model = Resource
        fields = [
            'title', 'description', 'file', 'category', 'library_type',
            'owner', 'tags', 'metadata'
        ]

    def validate_file(self, file):
        """Validate uploaded file"""
        # Check file size (100MB limit)
        max_size = 100 * 1024 * 1024  # 100MB
        if file.size > max_size:
            raise serializers.ValidationError("El archivo es demasiado grande. Máximo 100MB.")
        
        # Check file type
        allowed_types = [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4',
            'audio/mpeg'
        ]
        
        if file.content_type not in allowed_types:
            raise serializers.ValidationError(f"Tipo de archivo no permitido: {file.content_type}")
        
        return file

    def create(self, validated_data):
        """Create resource with file processing"""
        file = validated_data['file']
        
        # Set file metadata
        validated_data['original_filename'] = file.name
        validated_data['file_size'] = file.size
        validated_data['mime_type'] = file.content_type
        validated_data['upload_by'] = self.context['request'].user
        
        # Determine file type
        if file.content_type.startswith('image/'):
            validated_data['file_type'] = 'image'
        elif file.content_type == 'application/pdf':
            validated_data['file_type'] = 'pdf'
        elif file.content_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            validated_data['file_type'] = 'document'
        elif file.content_type.startswith('video/'):
            validated_data['file_type'] = 'video'
        elif file.content_type.startswith('audio/'):
            validated_data['file_type'] = 'audio'
        else:
            validated_data['file_type'] = 'other'
        
        # Generate content hash
        if isinstance(file, (InMemoryUploadedFile, TemporaryUploadedFile)):
            file.seek(0)
            file_content = file.read()
            file.seek(0)  # Reset file pointer
            validated_data['content_hash'] = hashlib.sha256(file_content).hexdigest()
        
        return super().create(validated_data)


class ResourceSummarySerializer(serializers.ModelSerializer):
    """Resource summary for lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_name = serializers.SerializerMethodField()
    file_extension = serializers.CharField(read_only=True)
    formatted_file_size = serializers.CharField(read_only=True)
    
    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'file_type', 'category_name', 'library_type',
            'owner_name', 'send_count', 'view_count', 'created_at',
            'file_extension', 'formatted_file_size'
        ]

    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return "Público"


class WatermarkTemplateSerializer(serializers.ModelSerializer):
    """Watermark template serializer"""
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = WatermarkTemplate
        fields = [
            'id', 'user', 'name', 'type', 'logo', 'text_content',
            'position', 'opacity', 'font_size', 'font_color', 'settings',
            'is_default', 'created_at', 'updated_at', 'user_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()


class ResourceEmailTemplateSerializer(serializers.ModelSerializer):
    """Resource email template serializer"""
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ResourceEmailTemplate
        fields = [
            'id', 'user', 'name', 'subject', 'body_html', 'body_text',
            'is_default', 'created_at', 'updated_at', 'user_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()


class ResourceSendSerializer(serializers.ModelSerializer):
    """Resource send tracking serializer"""
    resource_title = serializers.CharField(source='resource.title', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    sent_by_name = serializers.SerializerMethodField()
    email_template_name = serializers.CharField(source='email_template.name', read_only=True)
    watermark_template_name = serializers.CharField(source='watermark_template.name', read_only=True)
    
    class Meta:
        model = ResourceSend
        fields = [
            'id', 'resource', 'patient', 'sent_by', 'sent_at', 'send_method',
            'email_template', 'watermark_applied', 'watermark_template',
            'customizations', 'delivery_status', 'delivered_at', 'viewed_at',
            'download_count', 'notes', 'resource_title', 'patient_name',
            'sent_by_name', 'email_template_name', 'watermark_template_name'
        ]
        read_only_fields = ['id', 'sent_at']

    def get_sent_by_name(self, obj):
        return f"{obj.sent_by.first_name} {obj.sent_by.last_name}".strip()


class ResourceSendCreateSerializer(serializers.ModelSerializer):
    """Resource send creation serializer"""
    
    class Meta:
        model = ResourceSend
        fields = [
            'resource', 'patient', 'send_method', 'email_template',
            'watermark_applied', 'watermark_template', 'customizations', 'notes'
        ]

    def create(self, validated_data):
        validated_data['sent_by'] = self.context['request'].user
        
        # Update resource send count
        resource = validated_data['resource']
        resource.send_count += 1
        resource.save(update_fields=['send_count'])
        
        return super().create(validated_data)


class ResourceAccessLogSerializer(serializers.ModelSerializer):
    """Resource access log serializer"""
    resource_title = serializers.CharField(source='resource_send.resource.title', read_only=True)
    patient_name = serializers.CharField(source='resource_send.patient.full_name', read_only=True)
    
    class Meta:
        model = ResourceAccessLog
        fields = [
            'id', 'resource_send', 'accessed_at', 'ip_address',
            'user_agent', 'action', 'resource_title', 'patient_name'
        ]
        read_only_fields = ['id', 'accessed_at']


class ResourceCollectionSerializer(serializers.ModelSerializer):
    """Resource collection serializer"""
    user_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ResourceCollection
        fields = [
            'id', 'user', 'name', 'description', 'is_public',
            'created_at', 'updated_at', 'user_name', 'items_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()

    def get_items_count(self, obj):
        return obj.items.count()


class ResourceCollectionItemSerializer(serializers.ModelSerializer):
    """Resource collection item serializer"""
    resource_title = serializers.CharField(source='resource.title', read_only=True)
    resource_file_type = serializers.CharField(source='resource.file_type', read_only=True)
    
    class Meta:
        model = ResourceCollectionItem
        fields = [
            'collection', 'resource', 'sort_order', 'added_at',
            'resource_title', 'resource_file_type'
        ]
        read_only_fields = ['added_at']


# Statistics serializers
class ResourceStatsSerializer(serializers.Serializer):
    """Resource statistics serializer"""
    total_resources = serializers.IntegerField()
    public_resources = serializers.IntegerField()
    private_resources = serializers.IntegerField()
    premium_resources = serializers.IntegerField()
    total_sends = serializers.IntegerField()
    total_downloads = serializers.IntegerField()
    resources_by_type = serializers.DictField()
    recent_uploads = serializers.IntegerField()


class LibraryStatsSerializer(serializers.Serializer):
    """Library usage statistics"""
    most_sent_resources = ResourceSummarySerializer(many=True)
    recent_activity = ResourceSendSerializer(many=True)
    category_stats = serializers.DictField()
    send_method_stats = serializers.DictField()