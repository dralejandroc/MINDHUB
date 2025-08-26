"""
Resources URLs - REAL Supabase Schema
Using actual medical_resources table endpoints
"""

from django.urls import path
from . import views_real

urlpatterns = [
    # Medical Resources API endpoints (CORRECTED to use real schema)
    path('api/medical-resources/', views_real.get_medical_resources_catalog_real, name='medical_resources_catalog_real'),
    path('api/medical-resources/create/', views_real.create_medical_resource_real, name='create_medical_resource_real'),
    path('api/medical-resources/<uuid:resource_id>/', views_real.get_resource_by_id_real, name='get_medical_resource_real'),
    path('api/medical-resources/<uuid:resource_id>/download/', views_real.update_resource_download_count, name='download_medical_resource_real'),
    path('api/medical-resources/search/', views_real.search_medical_resources_real, name='search_medical_resources_real'),
    path('api/medical-resources/stats/', views_real.get_resources_stats_real, name='medical_resources_stats_real'),
    
    # Resource Categories API endpoints (CORRECTED to use real schema)
    path('api/resource-categories/', views_real.get_resource_categories_real, name='resource_categories_real'),
]

# =============================================================================
# DOCUMENTATION FOR FRONTEND INTEGRATION
# =============================================================================
#
# NEW: /resources/api/medical-resources/
#
# CHANGES:
# - Uses actual medical_resources table (NOT resources)
# - Uses actual resource_categories table with real field names
# - Fields: clinic_id, created_by, title, description, content, resource_type, etc.
# - Supports DUAL SYSTEM (clinic_id vs workspace_id for categories)
#
# FRONTEND CHANGES NEEDED:
# - Update ResourcesClient to use new endpoints
# - Change field mappings to match real database schema
# - Update resource_type and category handling
#
# =============================================================================