"""
ClinimetrixPro URLs - REAL Supabase Schema Routes
Updated to use API views that match actual database structure
"""

from django.urls import path
from . import api_views_real

app_name = 'clinimetrix_real'

urlpatterns = [
    # =========================================================================
    # REAL SCHEMA API ENDPOINTS
    # =========================================================================
    
    # Core assessment management (FIXED to use real schema)
    path('api/create-from-react-real/', 
         api_views_real.create_assessment_from_react_real, 
         name='api_create_from_react_real'),
    
    path('api/patient/<uuid:patient_id>/assessments-real/', 
         api_views_real.get_patient_assessments_real, 
         name='api_patient_assessments_real'),
    
    path('api/<uuid:assessment_id>/responses-real/', 
         api_views_real.save_assessment_responses_real, 
         name='api_save_responses_real'),
    
    path('api/<uuid:assessment_id>/complete-real/', 
         api_views_real.complete_assessment_real, 
         name='api_complete_real'),
    
    path('api/<uuid:assessment_id>/status-real/', 
         api_views_real.get_assessment_status_real, 
         name='api_status_real'),
    
    # Scales catalog (FIXED to use real psychometric_scales table)
    path('api/scales-catalog-real/', 
         api_views_real.get_scales_catalog_real, 
         name='api_scales_catalog_real'),
]

# ============================================================================= 
# MIGRATION NOTES:
# =============================================================================
# 
# TO MIGRATE FROM OLD TO NEW ENDPOINTS:
# 
# OLD: /assessments/api/create-from-react/
# NEW: /assessments/api/create-from-react-real/
# 
# CHANGES:
# - Uses actual patients table (NOT clinimetrix_patients)
# - Uses psychometric_scales.abbreviation (CORRECTED field name)
# - Creates clinimetrix_assessments with proper dual system
# - Returns proper UUIDs for all relationships
# 
# FRONTEND CHANGES NEEDED:
# - Update DjangoClinimetrixClient to use new endpoints
# - Ensure patient_id comes from real patients table
# - Update scale_abbreviation to match abbreviation values
# 
# =============================================================================