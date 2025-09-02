"""
URLs for ScalesV3 API endpoints
"""

from django.urls import path, include
from .api_views_v3 import (
    # Template catalog views
    template_catalog_view,
    template_detail_view,
    template_metadata_view,
    template_categories_view,
    template_search_view,
    
    # Assessment management views
    AssessmentCreateView,
    AssessmentDetailView,
    AssessmentResponsesView,
    AssessmentCompleteView,
    calculate_scores_view
)

# Template endpoints
template_urlpatterns = [
    path('catalog/', template_catalog_view, name='template_catalog'),
    path('categories/', template_categories_view, name='template_categories'),
    path('search/<str:query>/', template_search_view, name='template_search'),
    path('<str:template_id>/', template_detail_view, name='template_detail'),
    path('<str:template_id>/metadata/', template_metadata_view, name='template_metadata'),
]

# Assessment endpoints
assessment_urlpatterns = [
    path('new/', AssessmentCreateView.as_view(), name='assessment_create'),
    path('calculate-scores/', calculate_scores_view, name='calculate_scores'),
    path('<uuid:assessment_id>/', AssessmentDetailView.as_view(), name='assessment_detail'),
    path('<uuid:assessment_id>/responses/', AssessmentResponsesView.as_view(), name='assessment_responses'),
    path('<uuid:assessment_id>/complete/', AssessmentCompleteView.as_view(), name='assessment_complete'),
]

# Main URL patterns for ScalesV3
urlpatterns = [
    path('templates/', include(template_urlpatterns)),
    path('assessments/', include(assessment_urlpatterns)),
]

# Namespace for reverse URL lookups
app_name = 'clinimetrix_v3'