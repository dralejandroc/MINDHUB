"""
FrontDesk URLs - Endpoints for reception and secretary management
"""
from django.urls import path
from . import frontdesk_views

app_name = 'frontdesk'

urlpatterns = [
    # FrontDesk API endpoints
    path('stats/today/', frontdesk_views.today_stats, name='today_stats'),
    path('appointments/today/', frontdesk_views.today_appointments, name='today_appointments'),
    path('tasks/pending/', frontdesk_views.pending_tasks, name='pending_tasks'),
]