"""
Resources Models - REAL Supabase Schema Match
Based on actual medical_resources table structure
"""

import uuid
from django.db import models


class MedicalResource(models.Model):
    """
    Medical resources - EXACT match to medical_resources table
    """
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # REAL fields from Supabase schema
    clinic_id = models.UUIDField()  # NOT NULL in real table
    created_by = models.UUIDField()  # Direct UUID to profiles table
    title = models.CharField(max_length=255)  # NOT NULL in real table
    description = models.TextField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    resource_type = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=255, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True, null=True)  # ARRAY in DB
    file_url = models.TextField(blank=True, null=True)
    file_size = models.IntegerField(blank=True, null=True)
    file_type = models.CharField(max_length=255, blank=True, null=True)
    thumbnail_url = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(blank=True, null=True)
    is_template = models.BooleanField(blank=True, null=True)
    download_count = models.IntegerField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        db_table = 'medical_resources'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['clinic_id'], name='med_res_clinic_idx'),
            models.Index(fields=['created_by'], name='med_res_creator_idx'),
            models.Index(fields=['resource_type'], name='med_res_type_idx'),
            models.Index(fields=['category'], name='med_res_category_idx'),
            models.Index(fields=['is_public'], name='med_res_public_idx'),
        ]

    def __str__(self):
        return self.title

    @property
    def is_available(self):
        return True  # Always available unless we add status field
    
    @property
    def formatted_file_size(self):
        """Return human-readable file size"""
        if not self.file_size:
            return "Unknown"
            
        file_size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if file_size < 1024.0:
                return f"{file_size:.1f} {unit}"
            file_size /= 1024.0
        return f"{file_size:.1f} TB"


class RealResourceCategory(models.Model):
    """
    Resource categories - EXACT match to resource_categories table
    """
    
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # REAL fields from Supabase schema
    clinic_id = models.UUIDField()  # NOT NULL in real table
    name = models.CharField(max_length=255)  # NOT NULL in real table
    description = models.TextField(blank=True, null=True)
    parent_category_id = models.UUIDField(blank=True, null=True)  # Real field name
    display_order = models.IntegerField(blank=True, null=True)  # Real field name
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    workspace_id = models.UUIDField(blank=True, null=True)  # DUAL SYSTEM

    class Meta:
        db_table = 'resource_categories'
        managed = False  # Use existing Supabase table
        indexes = [
            models.Index(fields=['clinic_id'], name='res_cat_clinic_idx'),
            models.Index(fields=['parent_category_id'], name='res_cat_parent_idx'),
            models.Index(fields=['is_active'], name='res_cat_active_idx'),
            models.Index(fields=['display_order'], name='res_cat_order_idx'),
            models.Index(fields=['workspace_id'], name='res_cat_workspace_idx'),
        ]

    def __str__(self):
        return self.name


# ==============================================================================
# RELATIONSHIP HELPERS (since we can't use ForeignKeys with managed=False)
# ==============================================================================

def get_clinic_resources(clinic_id: str):
    """Get all resources for a clinic"""
    return MedicalResource.objects.filter(clinic_id=clinic_id)


def get_user_created_resources(user_id: str):
    """Get all resources created by a user"""
    return MedicalResource.objects.filter(created_by=user_id)


def get_public_resources():
    """Get all public resources"""
    return MedicalResource.objects.filter(is_public=True)


def get_resources_by_category(category: str):
    """Get resources by category"""
    return MedicalResource.objects.filter(category=category)


def get_resources_by_type(resource_type: str):
    """Get resources by type"""
    return MedicalResource.objects.filter(resource_type=resource_type)


def create_medical_resource(
    clinic_id: str,
    created_by: str,
    title: str,
    description: str = None,
    resource_type: str = None,
    category: str = None,
    **kwargs
) -> MedicalResource:
    """
    Create a new medical resource with proper field mapping
    """
    return MedicalResource.objects.create(
        clinic_id=clinic_id,
        created_by=created_by,
        title=title,
        description=description,
        resource_type=resource_type,
        category=category,
        **kwargs
    )