"""
Tests for BaseService - Service Layer Foundation
"""

import unittest
from unittest.mock import Mock, patch
import uuid
from django.test import TestCase

from core.services.base_service import BaseService
from core.validators.base_validator import BaseValidator
from core.utils.processing_result import ProcessingResult


class MockValidator(BaseValidator):
    """Mock validator for testing"""
    
    def get_required_fields(self):
        return ['name', 'email']
    
    def get_field_types(self):
        return {'name': str, 'email': str}
    
    def validate_business_rules(self, data):
        if data.get('name') == 'invalid':
            self.add_error("Invalid name")


class MockService(BaseService):
    """Mock service for testing BaseService functionality"""
    
    def get_validator(self):
        return MockValidator()
    
    def _create_entity(self, data):
        return {'id': str(uuid.uuid4()), **data}
    
    def _update_entity(self, entity, data):
        entity.update(data)
        return entity
    
    def _get_entity(self, entity_id):
        if str(entity_id) == 'not-found':
            return None
        return {'id': str(entity_id), 'name': 'Test'}
    
    def _delete_entity(self, entity):
        entity['deleted'] = True
    
    def _search_entities(self, filters, pagination=None):
        return {
            'results': [{'id': '1', 'name': 'Test'}],
            'total_count': 1,
            'page': 1,
            'page_size': 20
        }


class TestBaseService(TestCase):
    """Test BaseService functionality"""
    
    def setUp(self):
        self.service = MockService()
        self.mock_user = Mock()
        self.mock_user.id = str(uuid.uuid4())
        self.service.user = self.mock_user
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        self.assertIsInstance(self.service.validator, MockValidator)
        self.assertEqual(self.service.context, {})
    
    def test_context_management(self):
        """Test context setting and retrieval"""
        clinic_id = str(uuid.uuid4())
        self.service.set_context(clinic_id=clinic_id)
        
        self.assertEqual(self.service.context['clinic_id'], clinic_id)
    
    def test_validation_success(self):
        """Test successful validation"""
        data = {'name': 'John Doe', 'email': 'john@example.com'}
        result = self.service.validate_input(data, 'create')
        
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)
    
    def test_validation_failure(self):
        """Test validation failure"""
        data = {'name': 'invalid', 'email': 'john@example.com'}
        result = self.service.validate_input(data, 'create')
        
        self.assertFalse(result.is_valid)
        self.assertIn("Invalid name", result.errors)
    
    def test_create_success(self):
        """Test successful entity creation"""
        data = {'name': 'John Doe', 'email': 'john@example.com'}
        result = self.service.create(data)
        
        self.assertTrue(result.is_valid)
        self.assertIn('id', result.data)
        self.assertEqual(result.data['name'], 'John Doe')
    
    def test_create_validation_failure(self):
        """Test create with validation failure"""
        data = {'name': 'invalid', 'email': 'john@example.com'}
        result = self.service.create(data)
        
        self.assertFalse(result.is_valid)
        self.assertIn("Invalid name", result.errors)
    
    def test_update_success(self):
        """Test successful entity update"""
        entity_id = str(uuid.uuid4())
        data = {'name': 'Updated Name'}
        
        result = self.service.update(entity_id, data)
        
        self.assertTrue(result.is_valid)
        self.assertEqual(result.data['name'], 'Updated Name')
    
    def test_update_entity_not_found(self):
        """Test update with non-existent entity"""
        result = self.service.update('not-found', {'name': 'Test'})
        
        self.assertFalse(result.is_valid)
        self.assertIn("Entity not found", result.errors)
    
    def test_delete_success(self):
        """Test successful entity deletion"""
        entity_id = str(uuid.uuid4())
        result = self.service.delete(entity_id)
        
        self.assertTrue(result.is_valid)
        self.assertTrue(result.data['deleted'])
    
    def test_search_success(self):
        """Test successful search"""
        filters = {'name': 'Test'}
        result = self.service.search(filters)
        
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.data['results']), 1)
        self.assertEqual(result.data['total_count'], 1)
    
    def test_security_filters(self):
        """Test security filter application"""
        self.service.user.clinic_id = str(uuid.uuid4())
        filters = {'name': 'Test'}
        
        filtered = self.service.apply_security_filters(filters)
        
        self.assertIn('clinic_id', filtered)
        self.assertEqual(filtered['clinic_id'], self.service.user.clinic_id)
    
    def test_audit_data_generation(self):
        """Test audit data generation"""
        mock_entity = Mock()
        mock_entity.id = str(uuid.uuid4())
        
        audit_data = self.service.get_audit_data(mock_entity, 'create')
        
        self.assertEqual(audit_data['user_id'], self.service.user.id)
        self.assertEqual(audit_data['action'], 'create')
        self.assertEqual(audit_data['resource_id'], mock_entity.id)


class TestProcessingResult(TestCase):
    """Test ProcessingResult utility class"""
    
    def test_success_result(self):
        """Test successful result creation"""
        result = ProcessingResult.success({'id': 1}, "Success")
        
        self.assertTrue(result.is_valid)
        self.assertEqual(result.data['id'], 1)
        self.assertEqual(result.message, "Success")
        self.assertEqual(len(result.errors), 0)
    
    def test_failure_result(self):
        """Test failure result creation"""
        errors = ["Error 1", "Error 2"]
        result = ProcessingResult.failure(errors)
        
        self.assertFalse(result.is_valid)
        self.assertEqual(result.errors, errors)
        self.assertEqual(len(result.errors), 2)
    
    def test_add_error(self):
        """Test adding errors to result"""
        result = ProcessingResult()
        result.add_error("Test error")
        
        self.assertFalse(result.is_valid)
        self.assertIn("Test error", result.errors)
    
    def test_add_warning(self):
        """Test adding warnings to result"""
        result = ProcessingResult()
        result.add_warning("Test warning")
        
        self.assertTrue(result.is_valid)  # Warnings don't affect validity
        self.assertIn("Test warning", result.warnings)
    
    def test_to_dict_conversion(self):
        """Test conversion to dictionary"""
        result = ProcessingResult.success({'id': 1}, "Success")
        result.add_warning("Test warning")
        
        dict_result = result.to_dict()
        
        self.assertIn('data', dict_result)
        self.assertIn('is_valid', dict_result)
        self.assertIn('errors', dict_result)
        self.assertIn('warnings', dict_result)
        self.assertIn('message', dict_result)
        self.assertEqual(dict_result['warning_count'], 1)
    
    def test_boolean_conversion(self):
        """Test boolean conversion of result"""
        success_result = ProcessingResult.success({'id': 1})
        failure_result = ProcessingResult.failure(["Error"])
        
        self.assertTrue(bool(success_result))
        self.assertFalse(bool(failure_result))


if __name__ == '__main__':
    unittest.main()