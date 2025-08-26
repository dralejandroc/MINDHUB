"""
Advanced Search System - Medical-specific search capabilities
Inspired by OpenEMR's comprehensive search features
"""

import re
import uuid
from typing import Any, Dict, List, Optional, Union
from django.db.models import Q, QuerySet
from django.db import connection
import logging

from ..utils.processing_result import ProcessingResult

logger = logging.getLogger(__name__)


class AdvancedMedicalSearch:
    """
    Advanced search system for medical data
    Inspired by OpenEMR's search capabilities
    """
    
    def __init__(self, user=None):
        self.user = user
        self._context = {}
    
    def set_context(self, **context):
        """Set search context (clinic_id, workspace_id, etc.)"""
        self._context.update(context)
        return self
    
    def fuzzy_patient_search(self, query: str, max_results: int = 20) -> ProcessingResult:
        """
        Advanced fuzzy patient search with multiple matching strategies
        """
        try:
            from expedix.models import Patient
            
            if not query.strip():
                return ProcessingResult(
                    data=[],
                    is_valid=True,
                    message="Empty query provided"
                )
            
            # Clean and normalize query
            normalized_query = self._normalize_search_query(query)
            
            # Multiple search strategies
            search_results = []
            
            # 1. Exact matches (highest priority)
            exact_matches = self._exact_patient_matches(normalized_query)
            search_results.extend(exact_matches)
            
            # 2. Fuzzy name matches
            if len(search_results) < max_results:
                fuzzy_matches = self._fuzzy_patient_name_matches(
                    normalized_query, 
                    max_results - len(search_results),
                    exclude_ids=[r['id'] for r in search_results]
                )
                search_results.extend(fuzzy_matches)
            
            # 3. Phonetic matches (if still need more results)
            if len(search_results) < max_results:
                phonetic_matches = self._phonetic_patient_matches(
                    normalized_query,
                    max_results - len(search_results),
                    exclude_ids=[r['id'] for r in search_results]
                )
                search_results.extend(phonetic_matches)
            
            # 4. Partial identifier matches
            if len(search_results) < max_results:
                identifier_matches = self._identifier_patient_matches(
                    normalized_query,
                    max_results - len(search_results),
                    exclude_ids=[r['id'] for r in search_results]
                )
                search_results.extend(identifier_matches)
            
            return ProcessingResult(
                data=search_results[:max_results],
                is_valid=True,
                message=f"Found {len(search_results)} patients matching '{query}'"
            )
            
        except Exception as e:
            logger.error(f"Fuzzy patient search error: {str(e)}")
            return ProcessingResult(
                data=[],
                is_valid=False,
                errors=[f"Search failed: {str(e)}"]
            )
    
    def medical_condition_search(self, condition: str, include_history: bool = True) -> ProcessingResult:
        """
        Search patients by medical condition
        """
        try:
            from expedix.models import Patient
            
            condition_normalized = condition.lower().strip()
            
            # Search in chronic_conditions array field
            queryset = Patient.objects.filter(
                is_active=True
            )
            
            # Apply security filters
            queryset = self._apply_security_filters(queryset)
            
            # Search in conditions
            condition_q = Q()
            
            # Exact condition match
            condition_q |= Q(chronic_conditions__icontains=condition)
            
            # Partial matches in conditions
            condition_terms = condition_normalized.split()
            for term in condition_terms:
                if len(term) > 2:  # Only search terms longer than 2 chars
                    condition_q |= Q(chronic_conditions__icontains=term)
            
            # Search in allergies if they might be related
            if any(keyword in condition_normalized for keyword in ['allergy', 'allergic', 'reaction']):
                condition_q |= Q(allergies__icontains=condition)
            
            patients = queryset.filter(condition_q).distinct()
            
            # Format results
            results = []
            for patient in patients[:50]:  # Limit results
                matching_conditions = []
                
                # Find which conditions matched
                if patient.chronic_conditions:
                    for cond in patient.chronic_conditions:
                        if condition_normalized in cond.lower():
                            matching_conditions.append(cond)
                
                results.append({
                    'id': str(patient.id),
                    'full_name': patient.full_name,
                    'medical_record_number': patient.medical_record_number,
                    'matching_conditions': matching_conditions,
                    'total_conditions': len(patient.chronic_conditions or []),
                    'age': patient.age,
                    'gender': patient.gender
                })
            
            return ProcessingResult(
                data=results,
                is_valid=True,
                message=f"Found {len(results)} patients with condition '{condition}'"
            )
            
        except Exception as e:
            logger.error(f"Medical condition search error: {str(e)}")
            return ProcessingResult(
                data=[],
                is_valid=False,
                errors=[f"Medical condition search failed: {str(e)}"]
            )
    
    def medication_search(self, medication: str) -> ProcessingResult:
        """
        Search patients by current medication
        """
        try:
            from expedix.models import Patient
            
            medication_normalized = medication.lower().strip()
            
            queryset = Patient.objects.filter(is_active=True)
            queryset = self._apply_security_filters(queryset)
            
            # Search in current_medications array
            patients = queryset.filter(
                current_medications__icontains=medication
            )
            
            results = []
            for patient in patients[:50]:
                matching_medications = []
                
                if patient.current_medications:
                    for med in patient.current_medications:
                        if medication_normalized in med.lower():
                            matching_medications.append(med)
                
                results.append({
                    'id': str(patient.id),
                    'full_name': patient.full_name,
                    'medical_record_number': patient.medical_record_number,
                    'matching_medications': matching_medications,
                    'total_medications': len(patient.current_medications or []),
                    'age': patient.age,
                    'chronic_conditions': patient.chronic_conditions or []
                })
            
            return ProcessingResult(
                data=results,
                is_valid=True,
                message=f"Found {len(results)} patients taking '{medication}'"
            )
            
        except Exception as e:
            logger.error(f"Medication search error: {str(e)}")
            return ProcessingResult(
                data=[],
                is_valid=False,
                errors=[f"Medication search failed: {str(e)}"]
            )
    
    def demographic_search(self, criteria: Dict[str, Any]) -> ProcessingResult:
        """
        Advanced demographic search with multiple criteria
        """
        try:
            from expedix.models import Patient
            from datetime import date, timedelta
            
            queryset = Patient.objects.filter(is_active=True)
            queryset = self._apply_security_filters(queryset)
            
            # Age range
            if criteria.get('min_age') or criteria.get('max_age'):
                today = date.today()
                
                if criteria.get('min_age'):
                    min_birth_date = today - timedelta(days=int(criteria['min_age']) * 365.25)
                    queryset = queryset.filter(date_of_birth__lte=min_birth_date)
                
                if criteria.get('max_age'):
                    max_birth_date = today - timedelta(days=int(criteria['max_age']) * 365.25)
                    queryset = queryset.filter(date_of_birth__gte=max_birth_date)
            
            # Gender
            if criteria.get('gender'):
                queryset = queryset.filter(gender__iexact=criteria['gender'])
            
            # Blood type
            if criteria.get('blood_type'):
                queryset = queryset.filter(blood_type=criteria['blood_type'])
            
            # Location filters
            if criteria.get('city'):
                queryset = queryset.filter(city__icontains=criteria['city'])
            
            if criteria.get('state'):
                queryset = queryset.filter(state__icontains=criteria['state'])
            
            # Insurance
            if criteria.get('insurance_provider'):
                queryset = queryset.filter(
                    insurance_provider__icontains=criteria['insurance_provider']
                )
            
            # Marital status
            if criteria.get('marital_status'):
                queryset = queryset.filter(marital_status=criteria['marital_status'])
            
            # Has conditions
            if criteria.get('has_chronic_conditions'):
                if criteria['has_chronic_conditions']:
                    queryset = queryset.exclude(chronic_conditions__isnull=True).exclude(chronic_conditions=[])
                else:
                    queryset = queryset.filter(Q(chronic_conditions__isnull=True) | Q(chronic_conditions=[]))
            
            # Has allergies
            if criteria.get('has_allergies'):
                if criteria['has_allergies']:
                    queryset = queryset.exclude(allergies__isnull=True).exclude(allergies=[])
                else:
                    queryset = queryset.filter(Q(allergies__isnull=True) | Q(allergies=[]))
            
            patients = queryset[:100]  # Limit results
            
            # Format results
            results = []
            for patient in patients:
                results.append({
                    'id': str(patient.id),
                    'full_name': patient.full_name,
                    'medical_record_number': patient.medical_record_number,
                    'age': patient.age,
                    'gender': patient.gender,
                    'blood_type': patient.blood_type,
                    'city': patient.city,
                    'state': patient.state,
                    'insurance_provider': patient.insurance_provider,
                    'has_conditions': bool(patient.chronic_conditions),
                    'has_allergies': bool(patient.allergies),
                    'condition_count': len(patient.chronic_conditions or []),
                    'allergy_count': len(patient.allergies or [])
                })
            
            return ProcessingResult(
                data=results,
                is_valid=True,
                message=f"Found {len(results)} patients matching demographic criteria"
            )
            
        except Exception as e:
            logger.error(f"Demographic search error: {str(e)}")
            return ProcessingResult(
                data=[],
                is_valid=False,
                errors=[f"Demographic search failed: {str(e)}"]
            )
    
    def _normalize_search_query(self, query: str) -> str:
        """Normalize search query for better matching"""
        # Remove extra spaces, convert to lowercase
        normalized = re.sub(r'\s+', ' ', query.strip().lower())
        
        # Remove common prefixes/suffixes
        normalized = re.sub(r'^(dr\.?|prof\.?|sr\.?|sra\.?|miss|mr\.?|mrs\.?)\s+', '', normalized)
        
        return normalized
    
    def _exact_patient_matches(self, query: str) -> List[Dict[str, Any]]:
        """Find exact matches for patient search"""
        from expedix.models import Patient
        
        queryset = Patient.objects.filter(is_active=True)
        queryset = self._apply_security_filters(queryset)
        
        # Exact matches on key fields
        exact_q = Q()
        exact_q |= Q(medical_record_number__iexact=query)
        exact_q |= Q(curp__iexact=query)
        exact_q |= Q(email__iexact=query)
        exact_q |= Q(phone__iexact=query)
        
        # Full name exact matches
        exact_q |= Q(first_name__iexact=query)
        full_name_parts = query.split()
        if len(full_name_parts) >= 2:
            first_name = full_name_parts[0]
            last_name = ' '.join(full_name_parts[1:])
            exact_q |= Q(first_name__iexact=first_name, last_name__iexact=last_name)
            exact_q |= Q(first_name__iexact=first_name, paternal_last_name__iexact=last_name)
        
        patients = queryset.filter(exact_q)[:10]
        
        results = []
        for patient in patients:
            results.append({
                'id': str(patient.id),
                'full_name': patient.full_name,
                'medical_record_number': patient.medical_record_number,
                'age': patient.age,
                'gender': patient.gender,
                'phone': patient.phone,
                'email': patient.email,
                'match_type': 'exact'
            })
        
        return results
    
    def _fuzzy_patient_name_matches(self, query: str, max_results: int, exclude_ids: List[str]) -> List[Dict[str, Any]]:
        """Find fuzzy name matches for patients"""
        from expedix.models import Patient
        
        queryset = Patient.objects.filter(is_active=True)
        if exclude_ids:
            queryset = queryset.exclude(id__in=exclude_ids)
        queryset = self._apply_security_filters(queryset)
        
        # Fuzzy matching on names
        fuzzy_q = Q()
        
        # Single name fuzzy match
        fuzzy_q |= Q(first_name__icontains=query)
        fuzzy_q |= Q(last_name__icontains=query)
        fuzzy_q |= Q(paternal_last_name__icontains=query)
        fuzzy_q |= Q(maternal_last_name__icontains=query)
        
        # Multi-word fuzzy matching
        query_parts = query.split()
        for part in query_parts:
            if len(part) > 1:
                fuzzy_q |= Q(first_name__icontains=part)
                fuzzy_q |= Q(last_name__icontains=part)
                fuzzy_q |= Q(paternal_last_name__icontains=part)
                fuzzy_q |= Q(maternal_last_name__icontains=part)
        
        patients = queryset.filter(fuzzy_q)[:max_results]
        
        results = []
        for patient in patients:
            results.append({
                'id': str(patient.id),
                'full_name': patient.full_name,
                'medical_record_number': patient.medical_record_number,
                'age': patient.age,
                'gender': patient.gender,
                'phone': patient.phone,
                'email': patient.email,
                'match_type': 'fuzzy_name'
            })
        
        return results
    
    def _phonetic_patient_matches(self, query: str, max_results: int, exclude_ids: List[str]) -> List[Dict[str, Any]]:
        """Find phonetic matches (simplified implementation)"""
        # This is a simplified phonetic matching
        # In a full implementation, you'd use algorithms like Soundex, Metaphone, etc.
        
        from expedix.models import Patient
        
        # Simple phonetic substitutions for Spanish names
        phonetic_variants = self._generate_phonetic_variants(query)
        
        queryset = Patient.objects.filter(is_active=True)
        if exclude_ids:
            queryset = queryset.exclude(id__in=exclude_ids)
        queryset = self._apply_security_filters(queryset)
        
        phonetic_q = Q()
        for variant in phonetic_variants:
            phonetic_q |= Q(first_name__icontains=variant)
            phonetic_q |= Q(paternal_last_name__icontains=variant)
        
        patients = queryset.filter(phonetic_q)[:max_results]
        
        results = []
        for patient in patients:
            results.append({
                'id': str(patient.id),
                'full_name': patient.full_name,
                'medical_record_number': patient.medical_record_number,
                'age': patient.age,
                'gender': patient.gender,
                'match_type': 'phonetic'
            })
        
        return results
    
    def _identifier_patient_matches(self, query: str, max_results: int, exclude_ids: List[str]) -> List[Dict[str, Any]]:
        """Find matches on partial identifiers"""
        from expedix.models import Patient
        
        queryset = Patient.objects.filter(is_active=True)
        if exclude_ids:
            queryset = queryset.exclude(id__in=exclude_ids)
        queryset = self._apply_security_filters(queryset)
        
        # Partial identifier matches
        identifier_q = Q()
        
        # Partial medical record number
        identifier_q |= Q(medical_record_number__icontains=query)
        
        # Partial CURP
        if len(query) > 3:
            identifier_q |= Q(curp__icontains=query)
        
        # Partial phone
        clean_query = re.sub(r'[^\d]', '', query)
        if len(clean_query) > 3:
            identifier_q |= Q(phone__icontains=clean_query)
        
        patients = queryset.filter(identifier_q)[:max_results]
        
        results = []
        for patient in patients:
            results.append({
                'id': str(patient.id),
                'full_name': patient.full_name,
                'medical_record_number': patient.medical_record_number,
                'age': patient.age,
                'gender': patient.gender,
                'phone': patient.phone,
                'match_type': 'identifier'
            })
        
        return results
    
    def _generate_phonetic_variants(self, query: str) -> List[str]:
        """Generate phonetic variants for Spanish names"""
        variants = [query]
        
        # Common Spanish phonetic substitutions
        substitutions = [
            ('v', 'b'), ('b', 'v'),
            ('y', 'i'), ('i', 'y'),
            ('s', 'z'), ('z', 's'),
            ('c', 'k'), ('k', 'c'),
            ('j', 'x'), ('g', 'j'),
        ]
        
        for original, replacement in substitutions:
            if original in query:
                variants.append(query.replace(original, replacement))
        
        return variants
    
    def _apply_security_filters(self, queryset: QuerySet) -> QuerySet:
        """Apply security filters based on user context"""
        if self._context.get('clinic_id'):
            queryset = queryset.filter(clinic_id=self._context['clinic_id'])
        elif self._context.get('workspace_id'):
            queryset = queryset.filter(workspace_id=self._context['workspace_id'])
        elif hasattr(self.user, 'id') and self.user.id:
            queryset = queryset.filter(created_by=self.user.id)
        
        return queryset