"""
Base Validator Class - Inspired by OpenEMR Validation Pattern
Provides consistent validation patterns for all MindHub services
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
import re
from datetime import date, datetime
from ..utils.processing_result import ProcessingResult


class BaseValidator(ABC):
    """
    Base validator class providing common validation patterns.
    Inspired by OpenEMR's validation architecture.
    """
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def validate(self, data: Dict[str, Any]) -> ProcessingResult:
        """
        Main validation method
        
        Args:
            data: Data to validate
            
        Returns:
            ProcessingResult with validation results
        """
        self.errors = []
        self.warnings = []
        
        # Run validation rules
        self.validate_required_fields(data)
        self.validate_field_types(data)
        self.validate_field_formats(data)
        self.validate_business_rules(data)
        
        return ProcessingResult(
            data=data,
            is_valid=len(self.errors) == 0,
            errors=self.errors,
            warnings=self.warnings
        )
    
    def validate_create(self, data: Dict[str, Any]) -> ProcessingResult:
        """Validation for create operations"""
        result = self.validate(data)
        
        # Additional create-specific validations
        self.validate_create_specific(data)
        
        return ProcessingResult(
            data=data,
            is_valid=len(self.errors) == 0,
            errors=self.errors,
            warnings=self.warnings
        )
    
    def validate_update(self, data: Dict[str, Any]) -> ProcessingResult:
        """Validation for update operations"""
        result = self.validate(data)
        
        # Additional update-specific validations
        self.validate_update_specific(data)
        
        return ProcessingResult(
            data=data,
            is_valid=len(self.errors) == 0,
            errors=self.errors,
            warnings=self.warnings
        )
    
    # Abstract methods to be implemented by concrete validators
    @abstractmethod
    def get_required_fields(self) -> List[str]:
        """Return list of required fields"""
        pass
    
    @abstractmethod
    def get_field_types(self) -> Dict[str, type]:
        """Return field type mapping"""
        pass
    
    @abstractmethod
    def validate_business_rules(self, data: Dict[str, Any]) -> None:
        """Validate business-specific rules"""
        pass
    
    # Common validation methods
    def validate_required_fields(self, data: Dict[str, Any]) -> None:
        """Validate that all required fields are present"""
        required_fields = self.get_required_fields()
        
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                self.errors.append(f"Field '{field}' is required")
    
    def validate_field_types(self, data: Dict[str, Any]) -> None:
        """Validate field types"""
        field_types = self.get_field_types()
        
        for field, expected_type in field_types.items():
            if field in data and data[field] is not None:
                if not isinstance(data[field], expected_type):
                    self.errors.append(
                        f"Field '{field}' must be of type {expected_type.__name__}"
                    )
    
    def validate_field_formats(self, data: Dict[str, Any]) -> None:
        """Validate field formats (email, phone, etc.)"""
        # Email validation
        if 'email' in data and data['email']:
            if not self.is_valid_email(data['email']):
                self.errors.append("Invalid email format")
        
        # Phone validation
        if 'phone' in data and data['phone']:
            if not self.is_valid_phone(data['phone']):
                self.errors.append("Invalid phone format")
        
        # CURP validation (Mexican specific)
        if 'curp' in data and data['curp']:
            if not self.is_valid_curp(data['curp']):
                self.errors.append("Invalid CURP format")
    
    def validate_create_specific(self, data: Dict[str, Any]) -> None:
        """Create-specific validation rules (can be overridden)"""
        pass
    
    def validate_update_specific(self, data: Dict[str, Any]) -> None:
        """Update-specific validation rules (can be overridden)"""
        pass
    
    # Utility validation methods
    def is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def is_valid_phone(self, phone: str) -> bool:
        """Validate phone format (flexible for international)"""
        # Remove non-digits
        digits_only = re.sub(r'\D', '', phone)
        # Must be between 10-15 digits
        return 10 <= len(digits_only) <= 15
    
    def is_valid_curp(self, curp: str) -> bool:
        """Validate Mexican CURP format"""
        if len(curp) != 18:
            return False
        
        pattern = r'^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$'
        return bool(re.match(pattern, curp.upper()))
    
    def is_valid_date(self, date_str: str) -> bool:
        """Validate date format"""
        try:
            datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return True
        except (ValueError, AttributeError):
            return False
    
    def is_future_date(self, date_obj: Union[date, datetime]) -> bool:
        """Check if date is in the future"""
        if isinstance(date_obj, str):
            try:
                date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00')).date()
            except ValueError:
                return False
        elif isinstance(date_obj, datetime):
            date_obj = date_obj.date()
        
        return date_obj > date.today()
    
    def is_past_date(self, date_obj: Union[date, datetime]) -> bool:
        """Check if date is in the past"""
        return not self.is_future_date(date_obj)
    
    def validate_uuid(self, uuid_str: str) -> bool:
        """Validate UUID format"""
        try:
            import uuid
            uuid.UUID(str(uuid_str))
            return True
        except (ValueError, AttributeError):
            return False
    
    def validate_length(self, value: str, min_length: int = None, max_length: int = None) -> bool:
        """Validate string length"""
        if not isinstance(value, str):
            return False
        
        length = len(value)
        
        if min_length is not None and length < min_length:
            return False
        
        if max_length is not None and length > max_length:
            return False
        
        return True
    
    def add_error(self, error: str) -> None:
        """Add an error message"""
        self.errors.append(error)
    
    def add_warning(self, warning: str) -> None:
        """Add a warning message"""
        self.warnings.append(warning)
    
    def has_errors(self) -> bool:
        """Check if there are validation errors"""
        return len(self.errors) > 0
    
    def get_errors(self) -> List[str]:
        """Get all validation errors"""
        return self.errors.copy()
    
    def get_warnings(self) -> List[str]:
        """Get all validation warnings"""
        return self.warnings.copy()


class MedicalValidator(BaseValidator):
    """
    Base class for medical data validation
    Includes healthcare-specific validation rules
    """
    
    def validate_medical_fields(self, data: Dict[str, Any]) -> None:
        """Validate medical-specific fields"""
        # Blood type validation
        if 'blood_type' in data and data['blood_type']:
            valid_blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
            if data['blood_type'] not in valid_blood_types:
                self.errors.append("Invalid blood type")
        
        # Gender validation
        if 'gender' in data and data['gender']:
            valid_genders = ['M', 'F', 'male', 'female', 'masculino', 'femenino', 'other', 'otro']
            if data['gender'].lower() not in [g.lower() for g in valid_genders]:
                self.errors.append("Invalid gender value")
    
    def validate_age_appropriate(self, birth_date: Union[str, date], min_age: int = None, max_age: int = None) -> bool:
        """Validate age is appropriate for the context"""
        try:
            if isinstance(birth_date, str):
                birth_date = datetime.fromisoformat(birth_date.replace('Z', '+00:00')).date()
            
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            
            if min_age is not None and age < min_age:
                return False
            
            if max_age is not None and age > max_age:
                return False
            
            return True
            
        except (ValueError, AttributeError):
            return False