"""
URLs for assessments app
"""
from django.urls import path
from . import views, api_views, react_api_views

app_name = 'assessments'

urlpatterns = [
    # Regular views
    path('', views.AssessmentListView.as_view(), name='list'),
    path('<uuid:pk>/', views.AssessmentDetailView.as_view(), name='detail'),
    path('<uuid:pk>/take/', views.TakeAssessmentView.as_view(), name='take'),
    path('<uuid:assessment_id>/focused-take/', views.focused_take, name='focused_take'),
    path('<uuid:pk>/results/', views.AssessmentResultsView.as_view(), name='results'),
    path('patients/', views.PatientListView.as_view(), name='patient_list'),
    path('patients/<uuid:pk>/', views.PatientDetailView.as_view(), name='patient_detail'),
    path('patients/create/', views.PatientCreateView.as_view(), name='patient_create'),
    
    # API endpoints
    path('api/create-from-react/', api_views.create_and_start_assessment_from_react, name='api_create_from_react'),
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