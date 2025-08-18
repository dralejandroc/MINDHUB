"""
Core views for ClinimetrixPro
"""
from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count, Q
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import timedelta
from psychometric_scales.models import PsychometricScale
from assessments.models import Assessment, Patient, SecondaryDevice, AssessmentReminder
from accounts.models import MedicalProfile
import json


class HomeView(TemplateView):
    """Home page for non-authenticated users"""
    template_name = 'core/home.html'


class DashboardView(LoginRequiredMixin, TemplateView):
    """Main dashboard for authenticated users"""
    template_name = 'core/mindhub_dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        
        # Base patient queryset
        patients = Patient.objects.filter(
            Q(created_by=user) | Q(assigned_clinician=user)
        )
        
        # Demographics calculations
        total_patients = patients.count()
        female_count = patients.filter(gender='F').count()
        male_count = patients.filter(gender='M').count()
        
        # Age groups (calculate from birth_date)
        now = timezone.now()
        age_18_30 = 0
        age_31_50 = 0
        age_51_70 = 0
        age_70_plus = 0
        
        for patient in patients:
            if patient.date_of_birth:
                age = (now.date() - patient.date_of_birth).days // 365
                if 18 <= age <= 30:
                    age_18_30 += 1
                elif 31 <= age <= 50:
                    age_31_50 += 1
                elif 51 <= age <= 70:
                    age_51_70 += 1
                elif age > 70:
                    age_70_plus += 1
        
        # Activity statistics
        one_week_ago = now - timedelta(days=7)
        one_month_ago = now - timedelta(days=30)
        
        recent_assessments = Assessment.objects.filter(
            created_by=user,
            created_at__gte=one_week_ago
        ).count()
        
        monthly_assessments = Assessment.objects.filter(
            created_by=user,
            created_at__gte=one_month_ago
        ).count()
        
        daily_average = round(monthly_assessments / 30, 1) if monthly_assessments > 0 else 0
        
        # Statistics for dashboard
        context.update({
            'total_scales': PsychometricScale.objects.filter(is_active=True).count(),
            'my_assessments': Assessment.objects.filter(created_by=user).count(),
            'pending_assessments': Assessment.objects.filter(
                created_by=user,
                status__in=['not_started', 'in_progress']
            ).count(),
            'my_patients': total_patients,
            
            # Demographics
            'female_count': female_count,
            'male_count': male_count,
            'female_percentage': round((female_count/total_patients*100) if total_patients > 0 else 0),
            'male_percentage': round((male_count/total_patients*100) if total_patients > 0 else 0),
            
            # Age groups
            'age_18_30': age_18_30,
            'age_31_50': age_31_50,
            'age_51_70': age_51_70,
            'age_70_plus': age_70_plus,
            
            # Activity
            'recent_assessments': recent_assessments,
            'monthly_assessments': monthly_assessments,
            'daily_average': daily_average,
            
            'popular_scales': PsychometricScale.objects.filter(
                is_active=True
            ).annotate(
                assessment_count=Count('assessments')
            ).order_by('-assessment_count')[:6],
        })
        
        return context


class SettingsView(LoginRequiredMixin, TemplateView):
    """Settings page for user configuration"""
    template_name = 'core/settings.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        
        # Crear perfil médico si no existe
        medical_profile, created = MedicalProfile.objects.get_or_create(
            user=user,
            defaults={
                'data_processing_consent': False,
                'marketing_consent': False
            }
        )
        
        # Get user's devices and reminders
        context.update({
            'devices': user.secondary_devices.all(),
            'pending_reminders': user.assigned_reminders.filter(
                status='pending'
            ).order_by('due_date')[:10],
        })
        
        return context


@login_required
@require_http_methods(["POST"])
def add_device(request):
    """Add new secondary device"""
    try:
        name = request.POST.get('name')
        description = request.POST.get('description', '')
        device_type = request.POST.get('device_type', 'tablet')
        
        if not name:
            return JsonResponse({'success': False, 'error': 'Nombre es requerido'})
        
        device = SecondaryDevice.objects.create(
            user=request.user,
            name=name,
            description=description,
            device_type=device_type,
            is_active=True
        )
        
        return JsonResponse({
            'success': True,
            'device_id': str(device.id),
            'message': 'Dispositivo agregado exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def start_device_session(request, device_id):
    """Start session on secondary device"""
    try:
        device = get_object_or_404(
            SecondaryDevice, 
            id=device_id, 
            user=request.user
        )
        
        # Generate session token
        token = device.generate_session_token(duration_hours=8)
        
        return JsonResponse({
            'success': True,
            'token': token,
            'expires_at': device.session_expires_at.isoformat(),
            'message': 'Sesión iniciada exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def end_device_session(request, device_id):
    """End session on secondary device"""
    try:
        device = get_object_or_404(
            SecondaryDevice, 
            id=device_id, 
            user=request.user
        )
        
        device.end_session()
        
        return JsonResponse({
            'success': True,
            'message': 'Sesión terminada exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["DELETE"])
def delete_device(request, device_id):
    """Delete secondary device"""
    try:
        device = get_object_or_404(
            SecondaryDevice, 
            id=device_id, 
            user=request.user
        )
        
        device_name = device.name
        device.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Dispositivo "{device_name}" eliminado exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def complete_reminder(request, reminder_id):
    """Mark reminder as completed"""
    try:
        reminder = get_object_or_404(
            AssessmentReminder,
            id=reminder_id,
            assigned_to=request.user
        )
        
        reminder.mark_completed()
        
        return JsonResponse({
            'success': True,
            'message': 'Recordatorio completado'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def dismiss_reminder(request, reminder_id):
    """Dismiss reminder"""
    try:
        reminder = get_object_or_404(
            AssessmentReminder,
            id=reminder_id,
            assigned_to=request.user
        )
        
        reminder.status = AssessmentReminder.Status.DISMISSED
        reminder.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Recordatorio descartado'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def save_profile(request):
    """Save medical profile data"""
    try:
        data = json.loads(request.body)
        user = request.user
        
        # Obtener o crear perfil médico
        medical_profile, created = MedicalProfile.objects.get_or_create(user=user)
        
        # Actualizar campos
        medical_profile.date_of_birth = data.get('date_of_birth') or None
        medical_profile.mobile_phone = data.get('mobile_phone', '')
        medical_profile.city = data.get('city', '')
        medical_profile.profession_type = data.get('profession_type', '')
        medical_profile.professional_id = data.get('professional_id', '')
        medical_profile.specialty_id = data.get('specialty_id', '')
        medical_profile.work_environment = data.get('work_environment', [])
        medical_profile.institution_name = data.get('institution_name', '')
        medical_profile.discovery_source = data.get('discovery_source', '')
        medical_profile.discovery_other = data.get('discovery_other', '')
        medical_profile.data_processing_consent = data.get('data_processing_consent', False)
        medical_profile.marketing_consent = data.get('marketing_consent', False)
        
        medical_profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Perfil guardado exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def save_preferences(request):
    """Save user preferences"""
    try:
        data = json.loads(request.body)
        user = request.user
        
        # Obtener o crear perfil médico
        medical_profile, created = MedicalProfile.objects.get_or_create(user=user)
        
        # Actualizar preferencias
        medical_profile.theme_preference = data.get('theme_preference', 'auto')
        medical_profile.default_landing_page = data.get('default_landing_page', 'dashboard')
        
        medical_profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Preferencias guardadas exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
