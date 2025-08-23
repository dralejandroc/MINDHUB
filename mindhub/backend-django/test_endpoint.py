#!/usr/bin/env python3
"""
Simple standalone test endpoint
"""
from django.http import JsonResponse
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["GET"])
def test_patients(request):
    """Test endpoint to check patient data access"""
    try:
        # Test raw SQL query
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, first_name, last_name, created_by, clinic_id, is_active
                FROM patients 
                WHERE is_active = true
                ORDER BY created_at DESC 
                LIMIT 5;
            """)
            
            rows = cursor.fetchall()
            patients_data = []
            
            for row in rows:
                patients_data.append({
                    'id': str(row[0]),
                    'first_name': row[1],
                    'last_name': row[2],
                    'created_by': str(row[3]) if row[3] else None,
                    'clinic_id': str(row[4]) if row[4] else None,
                    'is_active': row[5]
                })
        
        # Also test Django ORM
        try:
            from expedix.models import Patient
            django_patients = list(Patient.objects.filter(is_active=True).values(
                'id', 'first_name', 'last_name', 'created_by', 'clinic_id', 'is_active'
            )[:5])
            
            # Convert UUIDs to strings for JSON serialization
            for patient in django_patients:
                for key, value in patient.items():
                    if hasattr(value, 'hex'):  # UUID object
                        patient[key] = str(value)
            
            django_success = True
            django_error = None
        except Exception as e:
            django_patients = []
            django_success = False
            django_error = str(e)
        
        return JsonResponse({
            'success': True,
            'raw_sql': {
                'success': True,
                'count': len(patients_data),
                'patients': patients_data
            },
            'django_orm': {
                'success': django_success,
                'error': django_error,
                'count': len(django_patients),
                'patients': django_patients
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Test failed: {str(e)}'
        }, status=500)