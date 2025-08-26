"""
Base Service Class - Inspired by OpenEMR ServiceBase
Provides common patterns for all MindHub services
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AnonymousUser
import logging
import uuid

from ..utils.processing_result import ProcessingResult
from ..validators.base_validator import BaseValidator

logger = logging.getLogger(__name__)


class BaseService(ABC):
    """
    Base service class providing common patterns for all MindHub services.
    Inspired by OpenEMR's ServiceBase architecture.
    """
    
    def __init__(self, user=None):
        self.user = user or AnonymousUser()
        self.validator = self.get_validator()
        self._context = {}
    
    @abstractmethod
    def get_validator(self) -> Optional[BaseValidator]:
        """Return the validator for this service"""
        return None
    
    @property
    def context(self) -> Dict[str, Any]:
        """Get service context (clinic_id, workspace_id, etc.)"""
        return self._context
    
    def set_context(self, **context):
        """Set service context"""
        self._context.update(context)
        return self
    
    def validate_input(self, data: Dict[str, Any], operation: str = 'create') -> ProcessingResult:
        """
        Validate input data using the service's validator
        
        Args:
            data: Data to validate
            operation: Type of operation (create, update, delete)
            
        Returns:
            ProcessingResult with validation results
        """
        if not self.validator:
            return ProcessingResult(data=data, is_valid=True)
        
        try:
            if operation == 'create':
                return self.validator.validate_create(data)
            elif operation == 'update':
                return self.validator.validate_update(data)
            else:
                return self.validator.validate(data)
        except Exception as e:
            logger.error(f"Validation error in {self.__class__.__name__}: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Validation failed: {str(e)}"]
            )
    
    def create(self, data: Dict[str, Any]) -> ProcessingResult:
        """
        Create a new entity with validation and audit
        
        Args:
            data: Entity data
            
        Returns:
            ProcessingResult with created entity or errors
        """
        # Validate input
        validation_result = self.validate_input(data, 'create')
        if not validation_result.is_valid:
            return validation_result
        
        try:
            with transaction.atomic():
                # Pre-creation hook
                data = self.pre_create(data)
                
                # Create entity
                entity = self._create_entity(data)
                
                # Post-creation hook  
                entity = self.post_create(entity, data)
                
                # Dispatch events
                self.dispatch_event('created', entity)
                
                return ProcessingResult(
                    data=entity,
                    is_valid=True,
                    message="Entity created successfully"
                )
                
        except Exception as e:
            logger.error(f"Create error in {self.__class__.__name__}: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Creation failed: {str(e)}"]
            )
    
    def update(self, entity_id: Union[str, uuid.UUID], data: Dict[str, Any]) -> ProcessingResult:
        """
        Update an existing entity with validation and audit
        
        Args:
            entity_id: ID of entity to update
            data: Updated data
            
        Returns:
            ProcessingResult with updated entity or errors
        """
        # Validate input
        validation_result = self.validate_input(data, 'update')
        if not validation_result.is_valid:
            return validation_result
        
        try:
            with transaction.atomic():
                # Get existing entity
                entity = self._get_entity(entity_id)
                if not entity:
                    return ProcessingResult(
                        data=None,
                        is_valid=False,
                        errors=["Entity not found"]
                    )
                
                # Pre-update hook
                data = self.pre_update(entity, data)
                
                # Update entity
                updated_entity = self._update_entity(entity, data)
                
                # Post-update hook
                updated_entity = self.post_update(updated_entity, data)
                
                # Dispatch events
                self.dispatch_event('updated', updated_entity)
                
                return ProcessingResult(
                    data=updated_entity,
                    is_valid=True,
                    message="Entity updated successfully"
                )
                
        except Exception as e:
            logger.error(f"Update error in {self.__class__.__name__}: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Update failed: {str(e)}"]
            )
    
    def delete(self, entity_id: Union[str, uuid.UUID]) -> ProcessingResult:
        """
        Delete an entity (soft delete recommended for medical data)
        
        Args:
            entity_id: ID of entity to delete
            
        Returns:
            ProcessingResult with success/failure
        """
        try:
            with transaction.atomic():
                entity = self._get_entity(entity_id)
                if not entity:
                    return ProcessingResult(
                        data=None,
                        is_valid=False,
                        errors=["Entity not found"]
                    )
                
                # Pre-delete hook
                entity = self.pre_delete(entity)
                
                # Delete entity (soft delete recommended)
                self._delete_entity(entity)
                
                # Post-delete hook
                self.post_delete(entity)
                
                # Dispatch events
                self.dispatch_event('deleted', entity)
                
                return ProcessingResult(
                    data=entity,
                    is_valid=True,
                    message="Entity deleted successfully"
                )
                
        except Exception as e:
            logger.error(f"Delete error in {self.__class__.__name__}: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Deletion failed: {str(e)}"]
            )
    
    def search(self, filters: Dict[str, Any], pagination: Optional[Dict[str, Any]] = None) -> ProcessingResult:
        """
        Search entities with advanced filtering (inspired by OpenEMR)
        
        Args:
            filters: Search filters
            pagination: Pagination parameters
            
        Returns:
            ProcessingResult with search results
        """
        try:
            # Apply security filters based on context
            filters = self.apply_security_filters(filters)
            
            # Execute search
            results = self._search_entities(filters, pagination)
            
            return ProcessingResult(
                data=results,
                is_valid=True,
                message=f"Found {len(results.get('results', []))} entities"
            )
            
        except Exception as e:
            logger.error(f"Search error in {self.__class__.__name__}: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Search failed: {str(e)}"]
            )
    
    # Abstract methods that must be implemented by concrete services
    @abstractmethod
    def _create_entity(self, data: Dict[str, Any]) -> Any:
        """Create the actual entity in the database"""
        pass
    
    @abstractmethod
    def _update_entity(self, entity: Any, data: Dict[str, Any]) -> Any:
        """Update the entity in the database"""
        pass
    
    @abstractmethod
    def _get_entity(self, entity_id: Union[str, uuid.UUID]) -> Any:
        """Retrieve entity by ID"""
        pass
    
    @abstractmethod
    def _delete_entity(self, entity: Any) -> None:
        """Delete entity (soft delete recommended)"""
        pass
    
    @abstractmethod
    def _search_entities(self, filters: Dict[str, Any], pagination: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Search entities with filters and pagination"""
        pass
    
    # Hook methods that can be overridden
    def pre_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Hook called before entity creation"""
        return data
    
    def post_create(self, entity: Any, data: Dict[str, Any]) -> Any:
        """Hook called after entity creation"""
        return entity
    
    def pre_update(self, entity: Any, data: Dict[str, Any]) -> Dict[str, Any]:
        """Hook called before entity update"""
        return data
    
    def post_update(self, entity: Any, data: Dict[str, Any]) -> Any:
        """Hook called after entity update"""
        return entity
    
    def pre_delete(self, entity: Any) -> Any:
        """Hook called before entity deletion"""
        return entity
    
    def post_delete(self, entity: Any) -> None:
        """Hook called after entity deletion"""
        pass
    
    def apply_security_filters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply security filters based on user context and permissions
        This should be overridden by services that need specific security filtering
        """
        # Add dual system filtering if context is available
        if hasattr(self.user, 'clinic_id') and self.user.clinic_id:
            filters['clinic_id'] = self.user.clinic_id
        elif hasattr(self.user, 'workspace_id') and self.user.workspace_id:
            filters['workspace_id'] = self.user.workspace_id
        
        return filters
    
    def dispatch_event(self, event_type: str, entity: Any) -> None:
        """
        Dispatch domain events (using Django signals)
        This can be overridden to emit custom events
        """
        try:
            from django.dispatch import Signal
            
            # Create signal if not exists
            signal_name = f"{self.__class__.__name__.lower()}_{event_type}"
            
            # This would typically be handled by a proper event system
            logger.info(f"Event dispatched: {signal_name} for entity {entity}")
            
        except Exception as e:
            logger.warning(f"Failed to dispatch event {event_type}: {str(e)}")
    
    def get_audit_data(self, entity: Any, action: str) -> Dict[str, Any]:
        """
        Get audit data for medical compliance
        Can be overridden by services that need custom audit data
        """
        return {
            'user_id': getattr(self.user, 'id', None),
            'action': action,
            'resource_type': self.__class__.__name__.replace('Service', '').lower(),
            'resource_id': getattr(entity, 'id', None),
            'clinic_id': self.context.get('clinic_id'),
            'workspace_id': self.context.get('workspace_id'),
        }