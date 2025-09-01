"""
URLs for assessments app
"""
from django.urls import path
from . import views, api_views, react_api_views
from django.views.generic import TemplateView

app_name = 'core'  # Changed to match template references

urlpatterns = [
    # API endpoint for dashboard - MUST be first to take priority
    path('', api_views.assessments_list_api, name='api_list'),
    
    # Public home page - moved to /home/
    path('home/', views.HomeView.as_view(), name='home'),
    
    # Core pages
    path('dashboard/', TemplateView.as_view(template_name='core/dashboard.html'), name='dashboard'),
    path('settings/', TemplateView.as_view(template_name='core/settings.html'), name='settings'),
    
    # Regular views  
    path('assessments/', views.AssessmentListView.as_view(), name='list'),
    path('<uuid:pk>/', views.AssessmentDetailView.as_view(), name='detail'),
    path('<uuid:pk>/take/', views.TakeAssessmentView.as_view(), name='take'),
    path('<uuid:assessment_id>/focused-take/', views.focused_take, name='focused_take'),
    path('<uuid:pk>/results/', views.AssessmentResultsView.as_view(), name='results'),
    path('patients/', views.PatientListView.as_view(), name='patient_list'),
    path('patients/<uuid:pk>/', views.PatientDetailView.as_view(), name='patient_detail'),
    path('patients/create/', views.PatientCreateView.as_view(), name='patient_create'),
    
    # API endpoints
    path('api/create-from-react/', api_views.create_and_start_assessment_from_react, name='api_create_from_react'),
    path('api/patient/<uuid:patient_id>/assessments/', api_views.PatientAssessmentsView.as_view(), name='api_patient_assessments'),
    path('api/<uuid:assessment_id>/progress/', api_views.AssessmentProgressView.as_view(), name='api_progress'),
    path('api/<uuid:assessment_id>/response/', api_views.AssessmentResponseView.as_view(), name='api_response'),
    path('api/<uuid:assessment_id>/complete/', api_views.AssessmentCompleteView.as_view(), name='api_complete'),
    path('api/<uuid:assessment_id>/results/', api_views.assessment_results_data, name='api_results'),
    path('api/<uuid:assessment_id>/scale-data-path/', api_views.assessment_scale_data_path, name='api_scale_data_path'),
    path('api/<uuid:assessment_id>/status/', api_views.assessment_status, name='api_status'),
    path('api/<uuid:assessment_id>/notify-completion/', api_views.notify_completion, name='api_notify_completion'),
    
    # Scheduling and Remote Links API
    path('schedule/create/', api_views.CreateScheduledAssessmentView.as_view(), name='schedule_create'),
    path('remote-link/create/', api_views.CreateRemoteLinkView.as_view(), name='remote_link_create'),
    path('remote/<str:token>/take/', views.RemoteAssessmentView.as_view(), name='remote_take'),
    
    # React Compatibility API endpoints
    path('react-api/catalog/', react_api_views.get_template_catalog, name='react_api_catalog'),
    path('react-api/template/<str:template_id>/', react_api_views.get_template, name='react_api_template'),
    path('react-api/assessment/create/', react_api_views.create_assessment, name='react_api_create_assessment'),
    path('react-api/assessment/<uuid:assessment_id>/responses/', react_api_views.save_responses, name='react_api_save_responses'),
    path('react-api/assessment/<uuid:assessment_id>/complete/', react_api_views.complete_assessment, name='react_api_complete_assessment'),
    path('react-api/health/', react_api_views.health_check, name='react_api_health'),
]