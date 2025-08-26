"""
Processing Result Class - Inspired by OpenEMR ProcessingResult
Standardized response pattern for all service operations
"""

from typing import Any, List, Optional, Dict
from dataclasses import dataclass


@dataclass
class ProcessingResult:
    """
    Standardized response object for all service operations.
    Inspired by OpenEMR's ProcessingResult pattern.
    """
    
    data: Any = None
    is_valid: bool = True
    errors: List[str] = None
    warnings: List[str] = None
    message: str = ""
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        """Initialize default values"""
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []
        if self.metadata is None:
            self.metadata = {}
        
        # If there are errors, mark as invalid
        if self.errors:
            self.is_valid = False
    
    def add_error(self, error: str) -> 'ProcessingResult':
        """Add an error message"""
        self.errors.append(error)
        self.is_valid = False
        return self
    
    def add_warning(self, warning: str) -> 'ProcessingResult':
        """Add a warning message"""
        self.warnings.append(warning)
        return self
    
    def add_metadata(self, key: str, value: Any) -> 'ProcessingResult':
        """Add metadata"""
        self.metadata[key] = value
        return self
    
    def has_errors(self) -> bool:
        """Check if there are errors"""
        return len(self.errors) > 0
    
    def has_warnings(self) -> bool:
        """Check if there are warnings"""
        return len(self.warnings) > 0
    
    def get_first_error(self) -> Optional[str]:
        """Get the first error message"""
        return self.errors[0] if self.errors else None
    
    def get_error_count(self) -> int:
        """Get number of errors"""
        return len(self.errors)
    
    def get_warning_count(self) -> int:
        """Get number of warnings"""
        return len(self.warnings)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            'data': self.data,
            'is_valid': self.is_valid,
            'errors': self.errors,
            'warnings': self.warnings,
            'message': self.message,
            'metadata': self.metadata,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings)
        }
    
    @classmethod
    def success(cls, data: Any = None, message: str = "") -> 'ProcessingResult':
        """Create a successful result"""
        return cls(
            data=data,
            is_valid=True,
            message=message or "Operation completed successfully"
        )
    
    @classmethod
    def failure(cls, errors: List[str], data: Any = None) -> 'ProcessingResult':
        """Create a failed result"""
        return cls(
            data=data,
            is_valid=False,
            errors=errors
        )
    
    @classmethod
    def validation_error(cls, field: str, message: str) -> 'ProcessingResult':
        """Create a validation error result"""
        return cls(
            data=None,
            is_valid=False,
            errors=[f"{field}: {message}"]
        )
    
    def __str__(self) -> str:
        """String representation"""
        status = "SUCCESS" if self.is_valid else "FAILURE"
        error_info = f" ({len(self.errors)} errors)" if self.errors else ""
        return f"ProcessingResult[{status}{error_info}]: {self.message}"
    
    def __bool__(self) -> bool:
        """Boolean representation - True if valid"""
        return self.is_valid


# Convenience functions for common patterns
def success_result(data: Any = None, message: str = "") -> ProcessingResult:
    """Create a successful processing result"""
    return ProcessingResult.success(data, message)


def error_result(error: str, data: Any = None) -> ProcessingResult:
    """Create an error processing result"""
    return ProcessingResult.failure([error], data)


def validation_result(field: str, message: str) -> ProcessingResult:
    """Create a validation error result"""
    return ProcessingResult.validation_error(field, message)