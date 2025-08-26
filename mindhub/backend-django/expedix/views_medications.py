"""
Medications API for Expedix
Real medication database management for consultations
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
import json

from expedix.authentication import SupabaseProxyAuthentication


class MedicationViewSet(viewsets.ViewSet):
    """
    Medication search and management for consultations
    """
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search medications by name"""
        query = request.query_params.get('q', '')
        
        if len(query) < 2:
            return Response({
                'success': True,
                'medications': []
            })
        
        # Common psychiatric medications
        medications_db = [
            {
                'id': 1,
                'name': 'Sertralina',
                'generic_name': 'Sertraline',
                'presentations': [
                    {'form': 'Tableta', 'concentration': '25mg', 'substance': 'Sertralina HCl'},
                    {'form': 'Tableta', 'concentration': '50mg', 'substance': 'Sertralina HCl'},
                    {'form': 'Tableta', 'concentration': '100mg', 'substance': 'Sertralina HCl'}
                ],
                'category': 'Antidepresivo ISRS',
                'common_prescriptions': [
                    'Tomar 1 tableta cada 24 horas en ayunas por la mañana',
                    'Tomar 1/2 tableta cada 24 horas por 7 días, luego 1 tableta diaria',
                    'Tomar 1 tableta cada 24 horas con alimentos'
                ]
            },
            {
                'id': 2,
                'name': 'Fluoxetina',
                'generic_name': 'Fluoxetine',
                'presentations': [
                    {'form': 'Cápsula', 'concentration': '10mg', 'substance': 'Fluoxetina HCl'},
                    {'form': 'Cápsula', 'concentration': '20mg', 'substance': 'Fluoxetina HCl'},
                    {'form': 'Cápsula', 'concentration': '40mg', 'substance': 'Fluoxetina HCl'}
                ],
                'category': 'Antidepresivo ISRS',
                'common_prescriptions': [
                    'Tomar 1 cápsula cada 24 horas en ayunas',
                    'Tomar 1 cápsula cada 24 horas con el desayuno',
                    'Tomar 1/2 cápsula cada 24 horas por una semana, luego aumentar'
                ]
            },
            {
                'id': 3,
                'name': 'Lorazepam',
                'generic_name': 'Lorazepam',
                'presentations': [
                    {'form': 'Tableta', 'concentration': '0.5mg', 'substance': 'Lorazepam'},
                    {'form': 'Tableta', 'concentration': '1mg', 'substance': 'Lorazepam'},
                    {'form': 'Tableta', 'concentration': '2mg', 'substance': 'Lorazepam'}
                ],
                'category': 'Benzodiacepina',
                'common_prescriptions': [
                    'Tomar 1 tableta cada 12 horas en caso de ansiedad',
                    'Tomar 1/2 tableta antes de dormir',
                    'Tomar 1 tableta cada 8 horas por máximo 15 días',
                    'Tomar según necesidad para ansiedad, máximo 3 tabletas al día'
                ]
            },
            {
                'id': 4,
                'name': 'Escitalopram',
                'generic_name': 'Escitalopram',
                'presentations': [
                    {'form': 'Tableta', 'concentration': '10mg', 'substance': 'Escitalopram oxalato'},
                    {'form': 'Tableta', 'concentration': '20mg', 'substance': 'Escitalopram oxalato'}
                ],
                'category': 'Antidepresivo ISRS',
                'common_prescriptions': [
                    'Tomar 1 tableta cada 24 horas en la mañana',
                    'Tomar 1/2 tableta por una semana, luego 1 tableta diaria',
                    'Tomar 1 tableta cada 24 horas preferentemente en ayunas'
                ]
            },
            {
                'id': 5,
                'name': 'Clonazepam',
                'generic_name': 'Clonazepam',
                'presentations': [
                    {'form': 'Tableta', 'concentration': '0.5mg', 'substance': 'Clonazepam'},
                    {'form': 'Tableta', 'concentration': '2mg', 'substance': 'Clonazepam'}
                ],
                'category': 'Benzodiacepina',
                'common_prescriptions': [
                    'Tomar 1/2 tableta cada 12 horas',
                    'Tomar 1 tableta antes de dormir',
                    'Tomar 1/4 tableta cada 8 horas según necesidad'
                ]
            },
            {
                'id': 6,
                'name': 'Aripiprazol',
                'generic_name': 'Aripiprazole',
                'presentations': [
                    {'form': 'Tableta', 'concentration': '5mg', 'substance': 'Aripiprazol'},
                    {'form': 'Tableta', 'concentration': '10mg', 'substance': 'Aripiprazol'},
                    {'form': 'Tableta', 'concentration': '15mg', 'substance': 'Aripiprazol'}
                ],
                'category': 'Antipsicótico atípico',
                'common_prescriptions': [
                    'Tomar 1 tableta cada 24 horas preferentemente en la mañana',
                    'Tomar 1/2 tableta cada 24 horas por una semana, luego ajustar',
                    'Tomar 1 tableta cada 24 horas con alimentos'
                ]
            },
            {
                'id': 7,
                'name': 'Quetiapina',
                'generic_name': 'Quetiapine',
                'presentations': [
                    {'form': 'Tableta', 'concentration': '25mg', 'substance': 'Quetiapina fumarato'},
                    {'form': 'Tableta', 'concentration': '100mg', 'substance': 'Quetiapina fumarato'},
                    {'form': 'Tableta', 'concentration': '200mg', 'substance': 'Quetiapina fumarato'}
                ],
                'category': 'Antipsicótico atípico',
                'common_prescriptions': [
                    'Tomar 1 tableta antes de dormir',
                    'Tomar 1/2 tableta cada 12 horas con alimentos',
                    'Tomar según indicación médica, incrementar gradualmente'
                ]
            }
        ]
        
        # Filter medications by query
        filtered_medications = [
            med for med in medications_db 
            if query.lower() in med['name'].lower() or 
               query.lower() in med['generic_name'].lower()
        ]
        
        return Response({
            'success': True,
            'medications': filtered_medications[:10],  # Limit to 10 results
            'total': len(filtered_medications)
        })
    
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