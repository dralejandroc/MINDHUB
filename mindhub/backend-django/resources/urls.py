"""
Resources URLs - Django REST Framework Router
Replaces Node.js Express routing for resource management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create DRF router
router = DefaultRouter()
router.register(r'categories', views.ResourceCategoryViewSet)
router.register(r'resources', views.ResourceViewSet)
router.register(r'watermark-templates', views.WatermarkTemplateViewSet)
router.register(r'email-templates', views.ResourceEmailTemplateViewSet)
router.register(r'sends', views.ResourceSendViewSet)
router.register(r'collections', views.ResourceCollectionViewSet)

# URL patterns that match Node.js API routes
urlpatterns = [
    # DRF router URLs
    path('', include(router.urls)),
    
    # Specific endpoints to match Node.js API exactly
    path('categories/tree/', views.ResourceCategoryViewSet.as_view({'get': 'tree'}), name='resource-categories-tree'),
    
    path('resources/library/', views.ResourceViewSet.as_view({'get': 'library'}), name='resources-library'),
    path('resources/stats/', views.ResourceViewSet.as_view({'get': 'stats'}), name='resources-stats'),
    path('resources/search/', views.ResourceViewSet.as_view({'get': 'search'}), name='resources-search'),
    path('resources/<uuid:pk>/download/', views.ResourceViewSet.as_view({'get': 'download'}), name='resource-download'),
    path('resources/<uuid:pk>/send-to-patient/', views.ResourceViewSet.as_view({'post': 'send_to_patient'}), name='resource-send-to-patient'),
    
    path('sends/by-patient/', views.ResourceSendViewSet.as_view({'get': 'by_patient'}), name='resource-sends-by-patient'),
    path('sends/by-resource/', views.ResourceSendViewSet.as_view({'get': 'by_resource'}), name='resource-sends-by-resource'),
    path('sends/<uuid:pk>/mark-viewed/', views.ResourceSendViewSet.as_view({'post': 'mark_viewed'}), name='resource-send-mark-viewed'),
    
    path('collections/<uuid:pk>/items/', views.ResourceCollectionViewSet.as_view({'get': 'items'}), name='resource-collection-items'),
    path('collections/<uuid:pk>/add-resource/', views.ResourceCollectionViewSet.as_view({'post': 'add_resource'}), name='resource-collection-add'),
    path('collections/<uuid:pk>/remove-resource/', views.ResourceCollectionViewSet.as_view({'post': 'remove_resource'}), name='resource-collection-remove'),
]