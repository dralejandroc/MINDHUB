"""
Medications API for Expedix
Real medication database management for consultations
CONECTADO A SUPABASE - medication_database (30 medicamentos reales)
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from django.db.models import Q
import json

from expedix.authentication import SupabaseProxyAuthentication
from .models import MedicationDatabase, PrescriptionMedication
from .serializers import MedicationDatabaseSerializer, PrescriptionMedicationSerializer, MedicationSearchSerializer


class MedicationViewSet(viewsets.ViewSet):
    """
    Medication search and management for consultations
    """
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search medications by name - CONECTADO A SUPABASE
        Consulta real a medication_database (30 medicamentos reales)
        """
        query = request.query_params.get('q', '')
        
        if len(query) < 2:
            return Response({
                'success': True,
                'medications': []
            })
        
        try:
            # 🎯 CONSULTA REAL A SUPABASE medication_database
            medications = MedicationDatabase.objects.filter(
                Q(commercial_name__icontains=query) |
                Q(generic_name__icontains=query) |
                Q(active_ingredients__icontains=query),
                is_active=True
            ).order_by('commercial_name')[:10]
            
            # Transform to frontend-compatible format
            medications_list = []
            for med in medications:
                med_data = {
                    'id': hash(str(med.id)) % 10000,  # Convert UUID to int for frontend compatibility
                    'name': med.commercial_name or med.generic_name,
                    'generic_name': med.generic_name or med.commercial_name,
                    'presentations': [
                        {
                            'form': med.pharmaceutical_form or 'Tableta',
                            'concentration': med.concentration or 'No especificada',
                            'substance': med.active_ingredients or med.generic_name
                        }
                    ],
                    'category': self._get_medication_category(med),
                    'common_prescriptions': self._get_common_prescriptions(med),
                    # Additional fields from real database
                    'control_group': med.control_group,
                    'therapeutic_indications': med.therapeutic_indications,
                    'laboratory': med.laboratory,
                    'contraindications': med.contraindications,
                    'dosage_recommendations': med.dosage_recommendations,
                    'uuid': str(med.id)  # Real UUID for backend operations
                }
                medications_list.append(med_data)
            
            return Response({
                'success': True,
                'medications': medications_list,
                'total': len(medications_list),
                'source': 'medication_database',  # Indicate real database source
                'query': query
            })
            
        except Exception as e:
            # Fallback in case of database issues
            return Response({
                'success': False,
                'error': f'Database error: {str(e)}',
                'medications': [],
                'total': 0
            }, status=500)
    
    def _get_medication_category(self, medication):
        """Determine medication category based on therapeutic indications"""
        indications = (medication.therapeutic_indications or '').lower()
        
        if any(word in indications for word in ['depres', 'antidepres', 'estado de ánimo']):
            return 'Antidepresivo'
        elif any(word in indications for word in ['ansied', 'ansiolitico', 'benzodiac']):
            return 'Ansiolítico'
        elif any(word in indications for word in ['psicos', 'esquizofren', 'bipolar']):
            return 'Antipsicótico'
        elif any(word in indications for word in ['dolor', 'analges', 'antiinflam']):
            return 'Analgésico'
        elif any(word in indications for word in ['antibiot', 'infeccion']):
            return 'Antibiótico'
        else:
            return medication.control_group or 'Medicamento'
    
    def _get_common_prescriptions(self, medication):
        """Generate common prescriptions based on medication data"""
        prescriptions = []
        
        # Use dosage recommendations if available
        if medication.dosage_recommendations:
            prescriptions.append(medication.dosage_recommendations)
        
        # Add generic prescriptions based on pharmaceutical form
        form = (medication.pharmaceutical_form or 'tableta').lower()
        
        if 'tableta' in form:
            prescriptions.extend([
                'Tomar 1 tableta cada 24 horas con alimentos',
                'Tomar 1 tableta cada 12 horas según indicación médica',
                'Tomar 1/2 tableta cada 24 horas, aumentar gradualmente'
            ])
        elif 'capsula' in form:
            prescriptions.extend([
                'Tomar 1 cápsula cada 24 horas en ayunas',
                'Tomar 1 cápsula cada 12 horas con alimentos'
            ])
        elif 'jarabe' in form:
            prescriptions.extend([
                'Tomar 5ml cada 8 horas con alimentos',
                'Tomar según indicación médica'
            ])
        else:
            prescriptions.extend([
                'Usar según indicación médica',
                'Seguir instrucciones del profesional de salud'
            ])
        
        return prescriptions[:4]  # Limit to 4 common prescriptions
    
    @action(detail=False, methods=['get'])
    def prescriptions(self, request):
        """Get common prescriptions for medications"""
        medication_name = request.query_params.get('medication', '')
        query = request.query_params.get('q', '')
        
        if not medication_name and not query:
            return Response({
                'success': False,
                'error': 'medication name or query required'
            }, status=400)
        
        # Common prescription patterns
        common_prescriptions = [
            'Tomar 1 tableta cada 24 horas en ayunas por la mañana',
            'Tomar 1 tableta cada 12 horas con alimentos',
            'Tomar 1/2 tableta cada 24 horas por 7 días, luego 1 tableta diaria',
            'Tomar 1 cápsula cada 24 horas en ayunas',
            'Tomar 1 cápsula cada 24 horas con el desayuno',
            'Tomar 1 tableta cada 12 horas en caso de ansiedad',
            'Tomar 1/2 tableta antes de dormir',
            'Tomar 1 tableta 3 veces al día por máximo 15 días',
            'Tomar según necesidad para ansiedad, máximo 3 tabletas al día',
            'Tomar 1 tableta antes de dormir',
            'Tomar 1/4 tableta cada 8 horas según necesidad',
            'Tomar 1 tableta cada 24 horas preferentemente en la mañana',
            'Tomar con alimentos para reducir efectos secundarios',
            'Iniciar con dosis baja y aumentar gradualmente según tolerancia'
        ]
        
        if query:
            filtered_prescriptions = [
                p for p in common_prescriptions 
                if query.lower() in p.lower()
            ]
        else:
            filtered_prescriptions = common_prescriptions
        
        return Response({
            'success': True,
            'prescriptions': filtered_prescriptions[:10],
            'total': len(filtered_prescriptions)
        })

    @action(detail=False, methods=['post'])
    def save_prescription(self, request):
        """
        Save prescription medications to prescription_medications table
        NUEVO: Guarda en base de datos real en lugar de solo retornar
        """
        try:
            data = request.data
            prescription_id = data.get('prescription_id')
            patient_id = data.get('patient_id')
            consultation_id = data.get('consultation_id')
            medications = data.get('medications', [])
            
            if not patient_id or not medications:
                return Response({
                    'success': False,
                    'error': 'patient_id and medications are required'
                }, status=400)
            
            # Generate prescription_id if not provided
            if not prescription_id:
                import uuid
                prescription_id = str(uuid.uuid4())
            
            # Save each medication
            saved_medications = []
            for med in medications:
                prescription_med = PrescriptionMedication.objects.create(
                    prescription_id=prescription_id,
                    patient_id=patient_id,
                    consultation_id=consultation_id,
                    professional_id=request.user_id,  # From auth middleware
                    medication_database_id=med.get('uuid'),  # Real UUID if from database
                    medication_name=med.get('name'),
                    generic_name=med.get('generic_name'),
                    concentration=med.get('concentration'),
                    pharmaceutical_form=med.get('form'),
                    dosage=med.get('dosage'),
                    frequency=med.get('frequency'),
                    duration=med.get('duration'),
                    special_instructions=med.get('instructions'),
                    medical_indication=med.get('indication'),
                    clinic_id=request.user_context.get('clinic_shared', False),
                    user_id=request.user_id
                )
                saved_medications.append(prescription_med)
            
            # Serialize and return saved data
            serializer = PrescriptionMedicationSerializer(saved_medications, many=True)
            
            return Response({
                'success': True,
                'prescription_id': prescription_id,
                'medications': serializer.data,
                'total_saved': len(saved_medications),
                'message': f'Receta guardada exitosamente con {len(saved_medications)} medicamentos'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error saving prescription: {str(e)}',
                'medications': []
            }, status=500)

    @action(detail=False, methods=['get'])
    def get_prescription(self, request):
        """
        Get prescription medications by prescription_id or patient_id
        """
        prescription_id = request.query_params.get('prescription_id')
        patient_id = request.query_params.get('patient_id')
        
        if not prescription_id and not patient_id:
            return Response({
                'success': False,
                'error': 'prescription_id or patient_id required'
            }, status=400)
        
        try:
            if prescription_id:
                medications = PrescriptionMedication.get_by_prescription(prescription_id)
            else:
                medications = PrescriptionMedication.get_by_patient(
                    patient_id,
                    user_id=request.user_id,
                    clinic_shared=request.user_context.get('clinic_shared')
                )
            
            serializer = PrescriptionMedicationSerializer(medications, many=True)
            
            return Response({
                'success': True,
                'medications': serializer.data,
                'total': len(medications)
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error retrieving prescription: {str(e)}',
                'medications': []
            }, status=500)


class DiagnosisViewSet(viewsets.ViewSet):
    """
    CIE-10 and diagnosis codes search for consultations
    """
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search diagnosis codes by description or code"""
        query = request.query_params.get('q', '')
        
        if len(query) < 2:
            return Response({
                'success': True,
                'diagnoses': []
            })
        
        # Common CIE-10 codes for psychiatric practice
        cie10_codes = [
            {'code': 'F32.0', 'description': 'Episodio depresivo leve', 'category': 'Trastornos del estado de ánimo'},
            {'code': 'F32.1', 'description': 'Episodio depresivo moderado', 'category': 'Trastornos del estado de ánimo'},
            {'code': 'F32.2', 'description': 'Episodio depresivo grave sin síntomas psicóticos', 'category': 'Trastornos del estado de ánimo'},
            {'code': 'F32.3', 'description': 'Episodio depresivo grave con síntomas psicóticos', 'category': 'Trastornos del estado de ánimo'},
            {'code': 'F33.0', 'description': 'Trastorno depresivo recurrente, episodio actual leve', 'category': 'Trastornos del estado de ánimo'},
            {'code': 'F33.1', 'description': 'Trastorno depresivo recurrente, episodio actual moderado', 'category': 'Trastornos del estado de ánimo'},
            {'code': 'F33.2', 'description': 'Trastorno depresivo recurrente, episodio actual grave sin síntomas psicóticos', 'category': 'Trastornos del estado de ánimo'},
            {'code': 'F33.3', 'description': 'Trastorno depresivo recurrente, episodio actual grave con síntomas psicóticos', 'category': 'Trastornos del estado de ánimo'},
            
            {'code': 'F41.0', 'description': 'Trastorno de pánico', 'category': 'Trastornos de ansiedad'},
            {'code': 'F41.1', 'description': 'Trastorno de ansiedad generalizada', 'category': 'Trastornos de ansiedad'},
            {'code': 'F41.2', 'description': 'Trastorno mixto ansioso-depresivo', 'category': 'Trastornos de ansiedad'},
            {'code': 'F40.0', 'description': 'Agorafobia', 'category': 'Trastornos de ansiedad'},
            {'code': 'F40.1', 'description': 'Fobias sociales', 'category': 'Trastornos de ansiedad'},
            {'code': 'F40.2', 'description': 'Fobias específicas', 'category': 'Trastornos de ansiedad'},
            
            {'code': 'F43.0', 'description': 'Reacción a estrés agudo', 'category': 'Trastornos adaptativos'},
            {'code': 'F43.1', 'description': 'Trastorno de estrés postraumático', 'category': 'Trastornos adaptativos'},
            {'code': 'F43.2', 'description': 'Trastornos de adaptación', 'category': 'Trastornos adaptativos'},
            
            {'code': 'F42.0', 'description': 'Trastorno obsesivo-compulsivo con predominio de pensamientos obsesivos', 'category': 'TOC'},
            {'code': 'F42.1', 'description': 'Trastorno obsesivo-compulsivo con predominio de actos compulsivos', 'category': 'TOC'},
            {'code': 'F42.2', 'description': 'Trastorno obsesivo-compulsivo mixto', 'category': 'TOC'},
            
            {'code': 'F20.0', 'description': 'Esquizofrenia paranoide', 'category': 'Esquizofrenia'},
            {'code': 'F20.1', 'description': 'Esquizofrenia hebefrenica', 'category': 'Esquizofrenia'},
            {'code': 'F20.2', 'description': 'Esquizofrenia catatónica', 'category': 'Esquizofrenia'},
            {'code': 'F25.0', 'description': 'Trastorno esquizoafectivo tipo maníaco', 'category': 'Esquizofrenia'},
            {'code': 'F25.1', 'description': 'Trastorno esquizoafectivo tipo depresivo', 'category': 'Esquizofrenia'},
            
            {'code': 'F31.0', 'description': 'Trastorno bipolar, episodio maníaco leve', 'category': 'Trastorno bipolar'},
            {'code': 'F31.1', 'description': 'Trastorno bipolar, episodio maníaco moderado', 'category': 'Trastorno bipolar'},
            {'code': 'F31.2', 'description': 'Trastorno bipolar, episodio maníaco grave sin síntomas psicóticos', 'category': 'Trastorno bipolar'},
            {'code': 'F31.3', 'description': 'Trastorno bipolar, episodio depresivo leve o moderado', 'category': 'Trastorno bipolar'},
            {'code': 'F31.4', 'description': 'Trastorno bipolar, episodio depresivo grave sin síntomas psicóticos', 'category': 'Trastorno bipolar'},
            
            {'code': 'F50.0', 'description': 'Anorexia nerviosa', 'category': 'Trastornos alimentarios'},
            {'code': 'F50.2', 'description': 'Bulimia nerviosa', 'category': 'Trastornos alimentarios'},
            {'code': 'F50.8', 'description': 'Otros trastornos de la conducta alimentaria', 'category': 'Trastornos alimentarios'},
            
            {'code': 'F84.0', 'description': 'Autismo infantil', 'category': 'Trastornos del desarrollo'},
            {'code': 'F84.1', 'description': 'Autismo atípico', 'category': 'Trastornos del desarrollo'},
            {'code': 'F90.0', 'description': 'Trastorno de la actividad y de la atención', 'category': 'Trastornos del desarrollo'},
            
            {'code': 'Z71.1', 'description': 'Persona con comportamiento de riesgo relativo al tabaco', 'category': 'Factores de riesgo'},
            {'code': 'Z04.6', 'description': 'Examen y observación consecutivos a accidente de trabajo', 'category': 'Exámenes'},
            {'code': 'Z00.0', 'description': 'Examen médico general', 'category': 'Exámenes'}
        ]
        
        # Filter codes by query
        filtered_codes = [
            code for code in cie10_codes
            if query.lower() in code['description'].lower() or 
               query.lower() in code['code'].lower() or
               query.lower() in code['category'].lower()
        ]
        
        return Response({
            'success': True,
            'diagnoses': filtered_codes[:15],  # Limit to 15 results
            'total': len(filtered_codes)
        })
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available diagnosis categories"""
        categories = [
            'Trastornos del estado de ánimo',
            'Trastornos de ansiedad', 
            'Trastornos adaptativos',
            'TOC',
            'Esquizofrenia',
            'Trastorno bipolar',
            'Trastornos alimentarios',
            'Trastornos del desarrollo',
            'Factores de riesgo',
            'Exámenes'
        ]
        
        return Response({
            'success': True,
            'categories': categories
        })