"""
FormX URL Configuration
Integrado con Django ClinimetrixPro existente
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'formx'

# DRF Router para APIs RESTful
router = DefaultRouter()
router.register(r'templates', views.FormTemplateViewSet)
router.register(r'submissions', views.FormSubmissionViewSet)
router.register(r'documents', views.DocumentTemplateViewSet)

urlpatterns = [
    # API RESTful endpoints
    path('api/', include(router.urls)),
    
    # Formularios para pacientes (móvil-friendly)
    path('fill/<str:token>/', views.FormRenderView.as_view(), name='form_render'),
    path('submit/<str:token>/', views.FormSubmitView.as_view(), name='form_submit'),
    
    # APIs específicas para React
    path('api/form-builder/', views.FormBuilderAPIView.as_view(), name='form_builder'),
    path('api/send-form/', views.SendFormToPatientAPIView.as_view(), name='send_form'),
    path('api/expedix-mapping/', views.ExpedixMappingAPIView.as_view(), name='expedix_mapping'),
    
    # Documentos
    path('api/generate-document/', views.GenerateDocumentAPIView.as_view(), name='generate_document'),
    path('api/send-document/', views.SendDocumentAPIView.as_view(), name='send_document'),
    
    # Integraciones
    path('api/sync-to-expedix/<uuid:submission_id>/', views.SyncToExpedixAPIView.as_view(), name='sync_to_expedix'),
    
    # Dashboard y estadísticas
    path('api/dashboard/stats/', views.FormXDashboardStatsAPIView.as_view(), name='dashboard_stats'),
    path('api/templates/catalog/', views.FormTemplateCatalogAPIView.as_view(), name='template_catalog'),
    
    # Health check
    path('api/health/', views.FormXHealthCheckAPIView.as_view(), name='health_check'),
]