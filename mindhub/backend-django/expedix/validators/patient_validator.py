"""
Patient Validator - Medical-specific validation
Inspired by OpenEMR validation patterns
"""

from typing import Dict, Any, List
from datetime import date, datetime
import uuid

from core.validators.base_validator import MedicalValidator
from ..models import Patient


class PatientValidator(MedicalValidator):
    """
    Patient-specific validation with medical compliance rules
    """
    
    def get_required_fields(self) -> List[str]:
        """Required fields for patient creation"""
        return [
            'first_name',
            # Note: In healthcare, sometimes only first_name is truly required
            # as emergency patients may not have full information initially
        ]
    
    def get_field_types(self) -> Dict[str, type]:
        """Field type mapping for patient data"""
        return {
            'first_name': str,
            'last_name': str,
            'paternal_last_name': str,
            'maternal_last_name': str,
            'medical_record_number': str,
            'age': int,
            'phone': str,
            'email': str,
            'address': str,
            'city': str,
            'state': str,
            'postal_code': str,
            'curp': str,
            'rfc': str,
            'blood_type': str,
            'marital_status': str,
            'occupation': str,
            'insurance_provider': str,
            'insurance_number': str,
            'consent_to_treatment': bool,
            'consent_to_data_processing': bool,
            'is_active': bool,
            'allergies': list,
            'chronic_conditions': list,
            'current_medications': list,
            'tags': list,
        }
    
    def validate_business_rules(self, data: Dict[str, Any]) -> None:
        """
        Patient-specific business rules validation
        """
        # Validate medical fields
        self.validate_medical_fields(data)
        
        # Validate Mexican CURP if provided
        if 'curp' in data and data['curp']:
            if not self.is_valid_curp(data['curp']):
                self.add_error("CURP format is invalid")
        
        # Validate birth date
        if 'date_of_birth' in data and data['date_of_birth']:
            birth_date = data['date_of_birth']
            if isinstance(birth_date, str):
                try:
                    birth_date = datetime.fromisoformat(birth_date.replace('Z', '+00:00')).date()
                except ValueError:
                    self.add_error("Invalid date of birth format")
                    return
            
            # Check if birth date is not in the future
            if birth_date > date.today():
                self.add_error("Date of birth cannot be in the future")
            
            # Check reasonable age limits
            if not self.validate_age_appropriate(birth_date, min_age=0, max_age=150):
                self.add_error("Patient age must be between 0 and 150 years")
        
        # Validate dual system constraint (clinic_id XOR workspace_id)
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        
        if clinic_id and workspace_id:
            self.add_error("Patient cannot belong to both clinic and workspace")
        elif not clinic_id and not workspace_id:
            self.add_error("Patient must belong to either a clinic or workspace")
        
        # Validate UUID fields
        uuid_fields = ['clinic_id', 'workspace_id', 'created_by', 'assigned_professional_id']
        for field in uuid_fields:
            if field in data and data[field]:
                if not self.validate_uuid(data[field]):
                    self.add_error(f"Invalid UUID format for {field}")
        
        # Validate consent fields for legal compliance
        if 'consent_to_data_processing' in data:
            if not data['consent_to_data_processing']:
                self.add_warning("Patient has not consented to data processing - this may limit available features")
        
        # Validate array fields
        array_fields = ['allergies', 'chronic_conditions', 'current_medications', 'tags']
        for field in array_fields:
            if field in data and data[field] is not None:
                if not isinstance(data[field], list):
                    self.add_error(f"{field} must be a list")
                else:
                    # Validate each item in the array is a string
                    for item in data[field]:
                        if not isinstance(item, str):
                            self.add_error(f"All items in {field} must be strings")
                            break
    
    def validate_create_specific(self, data: Dict[str, Any]) -> None:
        """
        Create-specific validation rules
        """
        # Medical record number should be unique if provided
        if 'medical_record_number' in data and data['medical_record_number']:
            # Check for existing patient with same medical record number
            try:
                existing = Patient.objects.filter(
                    medical_record_number=data['medical_record_number']
                ).first()
                if existing:
                    self.add_error("A patient with this medical record number already exists")
            except Exception:
                # If database check fails, continue (will be caught at save)
                pass
        
        # CURP should be unique if provided (Mexican requirement)
        if 'curp' in data and data['curp']:
            try:
                existing = Patient.objects.filter(curp=data['curp']).first()
                if existing:
                    self.add_error("A patient with this CURP already exists")
            except Exception:
                pass
    
    def validate_update_specific(self, data: Dict[str, Any]) -> None:
        """
        Update-specific validation rules
        """
        # For updates, we might want to validate that critical fields
        # like medical_record_number don't conflict with other patients
        pass
    
    def validate_emergency_contact(self, data: Dict[str, Any]) -> None:
        """
        Validate emergency contact information
        """
        emergency_name = data.get('emergency_contact_name')
        emergency_phone = data.get('emergency_contact_phone')
        
        if emergency_name and not emergency_phone:
            self.add_warning("Emergency contact provided but no phone number")
        elif emergency_phone and not emergency_name:
            self.add_warning("Emergency phone provided but no contact name")
        
        if emergency_phone and not self.is_valid_phone(emergency_phone):
            self.add_error("Invalid emergency contact phone format")
    
    def validate_insurance_info(self, data: Dict[str, Any]) -> None:
        """
        Validate insurance information
        """
        provider = data.get('insurance_provider')
        number = data.get('insurance_number')
        
        if provider and not number:
            self.add_warning("Insurance provider specified but no policy number")
        elif number and not provider:
            self.add_warning("Insurance number provided but no provider")
    
    def validate_consent_compliance(self, data: Dict[str, Any]) -> None:
        """
        Validate medical consent for legal compliance
        """
        treatment_consent = data.get('consent_to_treatment')
        data_consent = data.get('consent_to_data_processing')
        
        if treatment_consent is False:
            self.add_warning("Patient has not consented to treatment - medical services may be limited")
        
        if data_consent is False:
            self.add_warning("Patient has not consented to data processing - some features may be unavailable")
    
    def validate_mexican_healthcare_fields(self, data: Dict[str, Any]) -> None:
        """
        Validate Mexican healthcare-specific fields
        """
        # CURP validation (already done in business rules)
        # RFC validation for billing
        if 'rfc' in data and data['rfc']:
            rfc = data['rfc'].upper()
            # Basic RFC format validation (simplified)
            if not (len(rfc) in [12, 13] and rfc.replace('-', '').replace(' ', '').isalnum()):
                self.add_error("Invalid RFC format")
    
    def get_validation_summary(self) -> Dict[str, Any]:
        """
        Get a summary of validation results for medical audit
        """
        return {
            'total_errors': len(self.errors),
            'total_warnings': len(self.warnings),
            'errors': self.errors.copy(),
            'warnings': self.warnings.copy(),
            'validation_timestamp': datetime.now().isoformat(),
            'validator': 'PatientValidator',
            'compliance_checks': [
                'CURP_validation',
                'consent_validation', 
                'dual_system_constraint',
                'medical_fields_validation'
            ]
        }