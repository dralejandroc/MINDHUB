"""
URLs for core app - main dashboard and navigation
"""
from django.urls import path
from django.views.generic import TemplateView
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('settings/', views.SettingsView.as_view(), name='settings'),
    
    # Legal pages
    path('privacy/', TemplateView.as_view(template_name='legal/privacy.html'), name='privacy'),
    path('terms/', TemplateView.as_view(template_name='legal/terms.html'), name='terms'),
    
    # Device management
    path('devices/add/', views.add_device, name='add_device'),
    path('devices/<int:device_id>/start-session/', views.start_device_session, name='start_device_session'),
    path('devices/<int:device_id>/end-session/', views.end_device_session, name='end_device_session'),
    path('devices/<int:device_id>/delete/', views.delete_device, name='delete_device'),
    
    # Reminder management
    path('reminders/<int:reminder_id>/complete/', views.complete_reminder, name='complete_reminder'),
    path('reminders/<int:reminder_id>/dismiss/', views.dismiss_reminder, name='dismiss_reminder'),
    
    # Profile management
    path('profile/save/', views.save_profile, name='save_profile'),
    path('preferences/save/', views.save_preferences, name='save_preferences'),
]