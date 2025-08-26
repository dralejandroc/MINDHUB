"""
Patient Service - Medical patient management
Inspired by OpenEMR PatientService architecture
"""

import uuid
from typing import Any, Dict, List, Optional, Union
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
import logging

from core.services.base_service import BaseService
from core.utils.processing_result import ProcessingResult
from ..models import Patient
from ..validators.patient_validator import PatientValidator

logger = logging.getLogger(__name__)


class PatientService(BaseService):
    """
    Patient management service with medical compliance and audit
    Follows OpenEMR service patterns
    """
    
    def get_validator(self) -> PatientValidator:
        """Return patient validator"""
        return PatientValidator()
    
    def _create_entity(self, data: Dict[str, Any]) -> Patient:
        """Create patient in database"""
        # Generate medical record number if not provided
        if not data.get('medical_record_number'):
            data['medical_record_number'] = self.generate_medical_record_number()
        
        # Set default values for compliance
        if 'is_active' not in data:
            data['is_active'] = True
        
        # Create patient
        patient = Patient.objects.create(**data)
        return patient
    
    def _update_entity(self, entity: Patient, data: Dict[str, Any]) -> Patient:
        """Update patient in database"""
        # Update fields
        for field, value in data.items():
            if hasattr(entity, field):
                setattr(entity, field, value)
        
        entity.save()
        return entity
    
    def _get_entity(self, entity_id: Union[str, uuid.UUID]) -> Optional[Patient]:
        """Get patient by ID"""
        try:
            return Patient.objects.get(id=entity_id)
        except ObjectDoesNotExist:
            return None
    
    def _delete_entity(self, entity: Patient) -> None:
        """Soft delete patient (recommended for medical data)"""
        # For medical compliance, we do soft delete
        entity.is_active = False
        entity.save()
    
    def _search_entities(self, filters: Dict[str, Any], pagination: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Advanced patient search with medical-specific filtering
        Inspired by OpenEMR's comprehensive search capabilities
        """
        queryset = Patient.objects.filter(is_active=True)
        
        # Apply security filters first
        queryset = self._apply_security_filters(queryset)
        
        # Apply search filters
        queryset = self._apply_search_filters(queryset, filters)
        
        # Apply pagination
        page = pagination.get('page', 1) if pagination else 1
        page_size = pagination.get('page_size', 20) if pagination else 20
        
        total_count = queryset.count()
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        patients = list(queryset[start_index:end_index].values())
        
        return {
            'results': patients,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        }
    
    def _apply_security_filters(self, queryset):
        """Apply security filters based on user context"""
        # Apply dual system filtering
        if self.context.get('clinic_id'):
            queryset = queryset.filter(clinic_id=self.context['clinic_id'])
        elif self.context.get('workspace_id'):
            queryset = queryset.filter(workspace_id=self.context['workspace_id'])
        elif hasattr(self.user, 'id') and self.user.id:
            # If no context, filter by created_by for individual users
            queryset = queryset.filter(created_by=self.user.id)
        
        return queryset
    
    def _apply_search_filters(self, queryset, filters: Dict[str, Any]):
        """Apply advanced search filters inspired by OpenEMR"""
        
        # Full-text search across name fields
        if filters.get('search'):
            search_term = filters['search']
            queryset = queryset.filter(
                Q(first_name__icontains=search_term) |
                Q(last_name__icontains=search_term) |
                Q(paternal_last_name__icontains=search_term) |
                Q(maternal_last_name__icontains=search_term) |
                Q(medical_record_number__icontains=search_term) |
                Q(curp__icontains=search_term) |
                Q(phone__icontains=search_term) |
                Q(email__icontains=search_term)
            )
        
        # Specific field filters
        if filters.get('first_name'):
            queryset = queryset.filter(first_name__icontains=filters['first_name'])
        
        if filters.get('last_name'):
            queryset = queryset.filter(
                Q(last_name__icontains=filters['last_name']) |
                Q(paternal_last_name__icontains=filters['last_name']) |
                Q(maternal_last_name__icontains=filters['last_name'])
            )
        
        if filters.get('medical_record_number'):
            queryset = queryset.filter(medical_record_number=filters['medical_record_number'])
        
        if filters.get('curp'):
            queryset = queryset.filter(curp=filters['curp'])
        
        if filters.get('phone'):
            queryset = queryset.filter(phone__icontains=filters['phone'])
        
        if filters.get('email'):
            queryset = queryset.filter(email__icontains=filters['email'])
        
        # Age range filtering
        if filters.get('min_age') or filters.get('max_age'):
            from datetime import date, timedelta
            today = date.today()
            
            if filters.get('min_age'):
                min_birth_date = today - timedelta(days=filters['min_age'] * 365.25)
                queryset = queryset.filter(date_of_birth__lte=min_birth_date)
            
            if filters.get('max_age'):
                max_birth_date = today - timedelta(days=filters['max_age'] * 365.25)
                queryset = queryset.filter(date_of_birth__gte=max_birth_date)
        
        # Gender filter
        if filters.get('gender'):
            queryset = queryset.filter(gender=filters['gender'])
        
        # Medical filters
        if filters.get('blood_type'):
            queryset = queryset.filter(blood_type=filters['blood_type'])
        
        # Array field searches (allergies, conditions, medications)
        if filters.get('has_allergies'):
            queryset = queryset.exclude(allergies__isnull=True).exclude(allergies=[])
        
        if filters.get('allergy'):
            queryset = queryset.filter(allergies__contains=[filters['allergy']])
        
        if filters.get('condition'):
            queryset = queryset.filter(chronic_conditions__contains=[filters['condition']])
        
        if filters.get('medication'):
            queryset = queryset.filter(current_medications__contains=[filters['medication']])
        
        # Date filters
        if filters.get('created_after'):
            queryset = queryset.filter(created_at__gte=filters['created_after'])
        
        if filters.get('created_before'):
            queryset = queryset.filter(created_at__lte=filters['created_before'])
        
        # Assigned professional filter
        if filters.get('assigned_professional_id'):
            queryset = queryset.filter(assigned_professional_id=filters['assigned_professional_id'])
        
        # Tag filters
        if filters.get('tag'):
            queryset = queryset.filter(tags__contains=[filters['tag']])
        
        return queryset
    
    def fuzzy_search(self, query: str, max_results: int = 10) -> ProcessingResult:
        """
        Fuzzy search for patients (phonetic and typo-tolerant)
        Inspired by OpenEMR's advanced search capabilities
        """
        try:
            # Start with exact matches
            exact_matches = Patient.objects.filter(
                Q(first_name__iexact=query) |
                Q(last_name__iexact=query) |
                Q(paternal_last_name__iexact=query) |
                Q(maternal_last_name__iexact=query) |
                Q(medical_record_number__iexact=query) |
                Q(curp__iexact=query)
            )
            
            # Apply security filters
            exact_matches = self._apply_security_filters(exact_matches)
            
            results = list(exact_matches[:max_results].values())
            
            # If we don't have enough exact matches, add fuzzy matches
            if len(results) < max_results:
                remaining_slots = max_results - len(results)
                
                fuzzy_matches = Patient.objects.filter(
                    Q(first_name__icontains=query) |
                    Q(last_name__icontains=query) |
                    Q(paternal_last_name__icontains=query) |
                    Q(maternal_last_name__icontains=query) |
                    Q(medical_record_number__icontains=query) |
                    Q(phone__icontains=query) |
                    Q(email__icontains=query)
                ).exclude(
                    id__in=[r['id'] for r in results]
                )
                
                # Apply security filters
                fuzzy_matches = self._apply_security_filters(fuzzy_matches)
                
                fuzzy_results = list(fuzzy_matches[:remaining_slots].values())
                results.extend(fuzzy_results)
            
            return ProcessingResult(
                data=results,
                is_valid=True,
                message=f"Found {len(results)} patients matching '{query}'"
            )
            
        except Exception as e:
            logger.error(f"Fuzzy search error: {str(e)}")
            return ProcessingResult(
                data=[],
                is_valid=False,
                errors=[f"Search failed: {str(e)}"]
            )
    
    def get_patient_by_medical_record(self, medical_record_number: str) -> ProcessingResult:
        """Get patient by medical record number"""
        try:
            patient = Patient.objects.filter(
                medical_record_number=medical_record_number
            ).first()
            
            if not patient:
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Patient not found with this medical record number"]
                )
            
            # Apply security check
            if not self._can_access_patient(patient):
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Access denied to this patient"]
                )
            
            return ProcessingResult(
                data=patient,
                is_valid=True,
                message="Patient found successfully"
            )
            
        except Exception as e:
            logger.error(f"Get patient by MRN error: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Search failed: {str(e)}"]
            )
    
    def get_patients_by_professional(self, professional_id: Union[str, uuid.UUID]) -> ProcessingResult:
        """Get all patients assigned to a specific professional"""
        try:
            patients = Patient.objects.filter(
                assigned_professional_id=professional_id,
                is_active=True
            )
            
            # Apply security filters
            patients = self._apply_security_filters(patients)
            
            return ProcessingResult(
                data=list(patients.values()),
                is_valid=True,
                message=f"Found {patients.count()} patients for professional {professional_id}"
            )
            
        except Exception as e:
            logger.error(f"Get patients by professional error: {str(e)}")
            return ProcessingResult(
                data=[],
                is_valid=False,
                errors=[f"Search failed: {str(e)}"]
            )
    
    def _can_access_patient(self, patient: Patient) -> bool:
        """Check if current user can access this patient"""
        # Dual system access control
        if self.context.get('clinic_id'):
            return patient.clinic_id == self.context['clinic_id']
        elif self.context.get('workspace_id'):
            return patient.workspace_id == self.context['workspace_id']
        elif hasattr(self.user, 'id') and self.user.id:
            return patient.created_by == self.user.id
        
        return False
    
    def generate_medical_record_number(self) -> str:
        """Generate a unique medical record number"""
        import random
        from datetime import datetime
        
        # Format: YYYY-XXXXXX (year + 6 random digits)
        year = datetime.now().year
        random_part = random.randint(100000, 999999)
        
        candidate = f"{year}-{random_part}"
        
        # Ensure uniqueness
        while Patient.objects.filter(medical_record_number=candidate).exists():
            random_part = random.randint(100000, 999999)
            candidate = f"{year}-{random_part}"
        
        return candidate
    
    # Medical-specific service methods
    def get_patient_medical_summary(self, patient_id: Union[str, uuid.UUID]) -> ProcessingResult:
        """Get comprehensive medical summary for a patient"""
        try:
            patient = self._get_entity(patient_id)
            if not patient:
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Patient not found"]
                )
            
            if not self._can_access_patient(patient):
                return ProcessingResult(
                    data=None,
                    is_valid=False,
                    errors=["Access denied to this patient"]
                )
            
            # Build medical summary
            summary = {
                'patient_info': {
                    'id': str(patient.id),
                    'full_name': patient.full_name,
                    'medical_record_number': patient.medical_record_number,
                    'date_of_birth': patient.date_of_birth,
                    'age': patient.age,
                    'gender': patient.gender,
                    'blood_type': patient.blood_type,
                },
                'medical_info': {
                    'allergies': patient.allergies or [],
                    'chronic_conditions': patient.chronic_conditions or [],
                    'current_medications': patient.current_medications or [],
                },
                'contact_info': {
                    'phone': patient.phone,
                    'email': patient.email,
                    'address': patient.address,
                    'emergency_contact_name': patient.emergency_contact_name,
                    'emergency_contact_phone': patient.emergency_contact_phone,
                },
                'insurance_info': {
                    'provider': patient.insurance_provider,
                    'number': patient.insurance_number,
                },
                'consent_status': {
                    'treatment_consent': patient.consent_to_treatment,
                    'data_processing_consent': patient.consent_to_data_processing,
                }
            }
            
            return ProcessingResult(
                data=summary,
                is_valid=True,
                message="Medical summary retrieved successfully"
            )
            
        except Exception as e:
            logger.error(f"Get medical summary error: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to get medical summary: {str(e)}"]
            )
    
    # Hook overrides for medical-specific processing
    def pre_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Pre-create processing for patients"""
        # Set created_by from user context
        if hasattr(self.user, 'id') and self.user.id:
            data['created_by'] = self.user.id
        
        # Set clinic_id or workspace_id from context
        if self.context.get('clinic_id'):
            data['clinic_id'] = self.context['clinic_id']
        elif self.context.get('workspace_id'):
            data['workspace_id'] = self.context['workspace_id']
        
        return data
    
    def post_create(self, entity: Patient, data: Dict[str, Any]) -> Patient:
        """Post-create processing for patients"""
        # Log creation for audit
        logger.info(f"Patient created: {entity.id} by user {self.user.id}")
        
        # Could trigger additional medical events here
        # e.g., create initial medical history entry, send welcome message, etc.
        
        return entity
    
    def get_audit_data(self, entity: Patient, action: str) -> Dict[str, Any]:
        """Get audit data for medical compliance"""
        audit_data = super().get_audit_data(entity, action)
        
        # Add patient-specific audit information
        audit_data.update({
            'patient_id': entity.id,
            'medical_record_number': entity.medical_record_number,
            'patient_full_name': entity.full_name,
            'resource_type': 'patient',
        })
        
        return audit_data