"""
URLs for psychometric scales app
"""
from django.urls import path
from . import views

app_name = 'scales'

urlpatterns = [
    path('', views.ScaleCatalogView.as_view(), name='catalog'),
    path('<uuid:pk>/', views.ScaleDetailView.as_view(), name='detail'),
    path('<uuid:pk>/start/', views.StartAssessmentView.as_view(), name='start_assessment'),
    
    # API endpoints
    path('api/active/', views.ActiveScalesAPIView.as_view(), name='api_active_scales'),
]