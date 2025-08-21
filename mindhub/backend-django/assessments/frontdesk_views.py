"""
FrontDesk views - API endpoints for reception and secretary management
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["GET"])
def today_stats(request):
    """
    Get today's statistics for FrontDesk dashboard
    """
    try:
        logger.info('[FRONTDESK] Getting today\'s stats')
        
        # Mock data for now - will be connected to real data later
        stats = {
            'appointments': 12,
            'payments': 8,
            'pendingPayments': 3,
            'resourcesSent': 5
        }
        
        return JsonResponse({
            'success': True,
            'data': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f'[FRONTDESK] Error getting today stats: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': f'Error getting stats: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def today_appointments(request):
    """
    Get today's appointments for FrontDesk
    """
    try:
        logger.info('[FRONTDESK] Getting today\'s appointments')
        
        # Mock data for now
        appointments = [
            {
                'id': '1',
                'patientName': 'María González',
                'time': '09:00',
                'status': 'confirmed',
                'type': 'Consulta inicial'
            },
            {
                'id': '2', 
                'patientName': 'Carlos Rodríguez',
                'time': '10:30',
                'status': 'pending',
                'type': 'Seguimiento'
            },
            {
                'id': '3',
                'patientName': 'Ana Martínez',
                'time': '14:00',
                'status': 'confirmed',
                'type': 'Evaluación psicológica'
            }
        ]
        
        return JsonResponse({
            'success': True,
            'data': appointments,
            'count': len(appointments),
            'date': datetime.now().date().isoformat()
        })
        
    except Exception as e:
        logger.error(f'[FRONTDESK] Error getting today appointments: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': f'Error getting appointments: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def pending_tasks(request):
    """
    Get pending tasks for FrontDesk
    """
    try:
        logger.info('[FRONTDESK] Getting pending tasks')
        
        # Mock data for now
        tasks = [
            {
                'id': '1',
                'title': 'Confirmar cita de María González',
                'description': 'Llamar para confirmar cita de mañana',
                'priority': 'high',
                'dueDate': (datetime.now() + timedelta(hours=2)).isoformat()
            },
            {
                'id': '2',
                'title': 'Enviar recordatorio de pago',
                'description': 'Paciente Carlos Rodríguez - pago pendiente',
                'priority': 'medium',
                'dueDate': (datetime.now() + timedelta(days=1)).isoformat()
            },
            {
                'id': '3',
                'title': 'Preparar material para evaluación',
                'description': 'Test psicológicos para Ana Martínez',
                'priority': 'normal',
                'dueDate': (datetime.now() + timedelta(hours=6)).isoformat()
            }
        ]
        
        return JsonResponse({
            'success': True,
            'data': tasks,
            'count': len(tasks),
            'pendingCount': len([t for t in tasks if t['priority'] in ['high', 'medium']])
        })
        
    except Exception as e:
        logger.error(f'[FRONTDESK] Error getting pending tasks: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': f'Error getting tasks: {str(e)}'
        }, status=500)