"""
API views for core application
"""
import json
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.contrib.auth import get_user_model

from assessments.models import Assessment, Patient
from psychometric_scales.models import PsychometricScale

User = get_user_model()


@login_required
@require_http_methods(["GET"])
def dashboard_stats(request):
    """Get dashboard statistics for the current user"""
    
    # Get time ranges
    now = timezone.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Get period from query params (default to week)
    period = request.GET.get('period', 'week')
    start_date = week_ago if period == 'week' else month_ago
    
    # Base queryset for user's assessments
    user_assessments = Assessment.objects.filter(created_by=request.user)
    period_assessments = user_assessments.filter(created_at__gte=start_date)
    
    # Calculate statistics
    stats = {
        'period': period,
        'total_assessments': user_assessments.count(),
        'total_patients': Patient.objects.filter(created_by=request.user).count(),
        'total_scales': PsychometricScale.objects.count(),
        'pending_assessments': user_assessments.filter(status='pending').count(),
        
        # Period-specific stats
        'period_stats': {
            'assessments_completed': period_assessments.filter(status='completed').count(),
            'assessments_started': period_assessments.filter(status='in_progress').count(),
            'new_patients': Patient.objects.filter(
                created_by=request.user,
                created_at__gte=start_date
            ).count(),
            'average_completion_time': period_assessments.filter(
                status='completed',
                duration_minutes__isnull=False
            ).aggregate(avg_time=Avg('duration_minutes'))['avg_time'] or 0,
        }
    }
    
    # Calculate percentage changes compared to previous period
    previous_start = start_date - (now - start_date)
    previous_period_assessments = user_assessments.filter(
        created_at__gte=previous_start,
        created_at__lt=start_date
    )
    
    prev_completed = previous_period_assessments.filter(status='completed').count()
    current_completed = stats['period_stats']['assessments_completed']
    
    if prev_completed > 0:
        change_percent = ((current_completed - prev_completed) / prev_completed) * 100
        stats['period_stats']['completion_change_percent'] = round(change_percent, 1)
    else:
        stats['period_stats']['completion_change_percent'] = 0
    
    return JsonResponse(stats)


@login_required
@require_http_methods(["GET"])
def assessment_analytics(request):
    """Get detailed assessment analytics"""
    
    # Get time range
    days = int(request.GET.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    
    user_assessments = Assessment.objects.filter(
        created_by=request.user,
        created_at__gte=start_date
    )
    
    # Daily completion counts
    daily_completions = []
    for i in range(days):
        day = start_date + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        completed_count = user_assessments.filter(
            status='completed',
            completed_at__gte=day_start,
            completed_at__lt=day_end
        ).count()
        
        daily_completions.append({
            'date': day.strftime('%Y-%m-%d'),
            'completed': completed_count
        })
    
    # Scale usage statistics
    scale_usage = user_assessments.values(
        'scale__abbreviation',
        'scale__name'
    ).annotate(
        usage_count=Count('id'),
        avg_duration=Avg('duration_minutes')
    ).order_by('-usage_count')[:10]
    
    # Status distribution
    status_distribution = user_assessments.values('status').annotate(
        count=Count('id')
    )
    
    analytics = {
        'period_days': days,
        'daily_completions': daily_completions,
        'scale_usage': list(scale_usage),
        'status_distribution': list(status_distribution),
        'total_assessments_period': user_assessments.count(),
        'completion_rate': (
            user_assessments.filter(status='completed').count() / 
            max(user_assessments.count(), 1)
        ) * 100
    }
    
    return JsonResponse(analytics)


@login_required
@require_http_methods(["GET"])
def scale_catalog_api(request):
    """Get scales catalog data for API consumption"""
    
    scales = PsychometricScale.objects.all().values(
        'id',
        'name',
        'abbreviation',
        'category',
        'estimated_duration_minutes',
        'total_items',
        'created_at'
    )
    
    # Add usage statistics
    scales_with_stats = []
    for scale in scales:
        usage_count = Assessment.objects.filter(
            scale_id=scale['id'],
            created_by=request.user
        ).count()
        
        scale_data = dict(scale)
        scale_data['usage_count'] = usage_count
        scale_data['created_at'] = scale['created_at'].isoformat()
        scales_with_stats.append(scale_data)
    
    return JsonResponse({
        'scales': scales_with_stats,
        'total_count': len(scales_with_stats)
    })


@login_required
@require_http_methods(["GET"])
def patient_analytics(request):
    """Get patient-related analytics"""
    
    user_patients = Patient.objects.filter(created_by=request.user)
    
    # Age distribution
    age_groups = {
        '18-25': user_patients.filter(age__gte=18, age__lte=25).count(),
        '26-35': user_patients.filter(age__gte=26, age__lte=35).count(),
        '36-45': user_patients.filter(age__gte=36, age__lte=45).count(),
        '46-55': user_patients.filter(age__gte=46, age__lte=55).count(),
        '56-65': user_patients.filter(age__gte=56, age__lte=65).count(),
        '65+': user_patients.filter(age__gt=65).count(),
    }
    
    # Gender distribution
    gender_distribution = user_patients.values('gender').annotate(
        count=Count('id')
    )
    
    # Patients with assessments
    patients_with_assessments = user_patients.filter(
        assessment__isnull=False
    ).distinct().count()
    
    analytics = {
        'total_patients': user_patients.count(),
        'age_distribution': age_groups,
        'gender_distribution': list(gender_distribution),
        'patients_with_assessments': patients_with_assessments,
        'assessment_coverage': (
            patients_with_assessments / max(user_patients.count(), 1)
        ) * 100
    }
    
    return JsonResponse(analytics)


@login_required
@require_http_methods(["GET"])
def system_health(request):
    """Get system health and status information"""
    
    # Only allow superusers to access system health
    if not request.user.is_superuser:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    # System statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(last_login__isnull=False).count()
    total_assessments = Assessment.objects.count()
    completed_assessments = Assessment.objects.filter(status='completed').count()
    
    # Recent activity (last 24 hours)
    yesterday = timezone.now() - timedelta(days=1)
    recent_assessments = Assessment.objects.filter(created_at__gte=yesterday).count()
    recent_users = User.objects.filter(last_login__gte=yesterday).count()
    
    health_data = {
        'system_stats': {
            'total_users': total_users,
            'active_users': active_users,
            'total_assessments': total_assessments,
            'completed_assessments': completed_assessments,
            'completion_rate': (completed_assessments / max(total_assessments, 1)) * 100
        },
        'recent_activity': {
            'assessments_24h': recent_assessments,
            'active_users_24h': recent_users,
        },
        'timestamp': timezone.now().isoformat()
    }
    
    return JsonResponse(health_data)