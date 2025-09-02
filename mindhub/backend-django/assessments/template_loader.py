"""
JSON Template Loader for ScalesV3 System
Loads and manages the new JSON-based scale templates from scalesV3 folder
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class ScalesV3TemplateLoader:
    """
    Loads and manages JSON templates from scalesV3 directory
    Combines catalog metadata with assessment structure
    """
    
    def __init__(self):
        self.scales_dir = Path(settings.BASE_DIR) / 'scalesV3'
        self.cache_timeout = 60 * 60  # 1 hour cache
        
    def get_available_scales(self) -> List[Dict]:
        """
        Get list of all available scales with their metadata
        """
        cache_key = 'scalesv3_available_scales'
        cached_scales = cache.get(cache_key)
        
        if cached_scales:
            return cached_scales
            
        scales = []
        
        for catalog_file in self.scales_dir.glob('*-catalog.json'):
            try:
                scale_id = catalog_file.stem.replace('-catalog', '')
                catalog = self._load_catalog(scale_id)
                
                if catalog:
                    scales.append({
                        'id': scale_id,
                        'template_id': catalog['metadata']['id'],
                        'name': catalog['metadata']['name'],
                        'abbreviation': catalog['metadata']['abbreviation'],
                        'version': catalog['metadata']['version'],
                        'category': catalog['metadata']['category'],
                        'subcategory': catalog['metadata'].get('subcategory', ''),
                        'description': catalog['metadata']['description'],
                        'authors': catalog['metadata']['authors'],
                        'year': catalog['metadata']['year'],
                        'language': catalog['metadata']['language'],
                        'administrationMode': catalog['metadata']['administrationMode'],
                        'estimatedDurationMinutes': catalog['metadata']['estimatedDurationMinutes'],
                        'targetPopulation': catalog['metadata']['targetPopulation'],
                        'isActive': True,
                        'isFeatured': scale_id in ['phq9', 'gadi', 'bdi-13'],  # Feature popular scales
                        'lastUpdated': catalog['documentation']['lastUpdated']
                    })
            except Exception as e:
                logger.error(f"Error loading scale {scale_id}: {str(e)}")
                continue
        
        # Sort by category, then name
        scales.sort(key=lambda x: (x['category'], x['name']))
        
        cache.set(cache_key, scales, self.cache_timeout)
        return scales
    
    def get_scale_template(self, scale_id: str) -> Optional[Dict]:
        """
        Get complete template for a scale (catalog + assessment combined)
        """
        cache_key = f'scalesv3_template_{scale_id}'
        cached_template = cache.get(cache_key)
        
        if cached_template:
            return cached_template
            
        try:
            catalog = self._load_catalog(scale_id)
            assessment = self._load_assessment(scale_id)
            
            if not catalog or not assessment:
                return None
            
            # Combine catalog and assessment into unified template
            template = {
                'metadata': {
                    **catalog['metadata'],
                    'documentation': catalog['documentation'],
                    'psychometricProperties': catalog['psychometricProperties'],
                    'normativeData': catalog['normativeData'],
                    'clinicalValidation': catalog['clinicalValidation'],
                    'academicInformation': catalog['academicInformation'],
                    'technicalSpecifications': catalog['technicalSpecifications'],
                    'usageStatistics': catalog['usageStatistics'],
                    'limitations': catalog['limitations'],
                    'helpText': assessment['metadata'].get('helpText', {})
                },
                'structure': assessment['structure'],
                'responseGroups': assessment['responseGroups'],
                'scoring': assessment['scoring'],
                'interpretation': {
                    **assessment['interpretation'],
                    'clinicalInterpretation': assessment.get('clinicalInterpretation', {}),
                    'cutoffPoints': assessment.get('cutoffPoints', {})
                },
                'qualityAssurance': assessment.get('qualityAssurance', {})
            }
            
            cache.set(cache_key, template, self.cache_timeout)
            return template
            
        except Exception as e:
            logger.error(f"Error loading template for {scale_id}: {str(e)}")
            return None
    
    def get_scale_catalog(self, scale_id: str) -> Optional[Dict]:
        """
        Get catalog information only for a scale
        """
        return self._load_catalog(scale_id)
    
    def get_scale_assessment(self, scale_id: str) -> Optional[Dict]:
        """
        Get assessment structure only for a scale
        """
        return self._load_assessment(scale_id)
    
    def _load_catalog(self, scale_id: str) -> Optional[Dict]:
        """
        Load catalog JSON file for a scale
        """
        catalog_file = self.scales_dir / f'{scale_id}-catalog.json'
        
        if not catalog_file.exists():
            return None
            
        try:
            with open(catalog_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading catalog for {scale_id}: {str(e)}")
            return None
    
    def _load_assessment(self, scale_id: str) -> Optional[Dict]:
        """
        Load assessment JSON file for a scale
        """
        assessment_file = self.scales_dir / f'{scale_id}-assessment.json'
        
        if not assessment_file.exists():
            return None
            
        try:
            with open(assessment_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading assessment for {scale_id}: {str(e)}")
            return None
    
    def get_categories(self) -> List[Dict]:
        """
        Get available categories with count
        """
        scales = self.get_available_scales()
        categories = {}
        
        for scale in scales:
            category = scale['category']
            if category not in categories:
                categories[category] = {'category': category, 'count': 0}
            categories[category]['count'] += 1
        
        return list(categories.values())
    
    def search_scales(self, query: str) -> List[Dict]:
        """
        Search scales by name, abbreviation, or description
        """
        query = query.lower()
        scales = self.get_available_scales()
        
        results = []
        for scale in scales:
            if (query in scale['name'].lower() or 
                query in scale['abbreviation'].lower() or 
                query in scale['description'].lower()):
                results.append(scale)
        
        return results
    
    def get_scales_by_category(self, category: str) -> List[Dict]:
        """
        Get scales filtered by category
        """
        scales = self.get_available_scales()
        return [scale for scale in scales if scale['category'].lower() == category.lower()]
    
    def refresh_cache(self):
        """
        Clear all cached templates and scales
        """
        # Clear main cache
        cache.delete('scalesv3_available_scales')
        
        # Clear individual template caches
        for catalog_file in self.scales_dir.glob('*-catalog.json'):
            scale_id = catalog_file.stem.replace('-catalog', '')
            cache.delete(f'scalesv3_template_{scale_id}')
        
        logger.info("ScalesV3 cache refreshed")
    
    def validate_template(self, scale_id: str) -> Tuple[bool, List[str]]:
        """
        Validate that a scale has both catalog and assessment files with proper structure
        """
        errors = []
        
        catalog_file = self.scales_dir / f'{scale_id}-catalog.json'
        assessment_file = self.scales_dir / f'{scale_id}-assessment.json'
        
        # Check file existence
        if not catalog_file.exists():
            errors.append(f"Catalog file missing: {catalog_file}")
        if not assessment_file.exists():
            errors.append(f"Assessment file missing: {assessment_file}")
            
        if errors:
            return False, errors
        
        try:
            # Validate catalog structure
            catalog = self._load_catalog(scale_id)
            if not catalog:
                errors.append("Failed to load catalog")
            else:
                required_catalog_fields = ['metadata', 'documentation', 'psychometricProperties']
                for field in required_catalog_fields:
                    if field not in catalog:
                        errors.append(f"Missing catalog field: {field}")
            
            # Validate assessment structure
            assessment = self._load_assessment(scale_id)
            if not assessment:
                errors.append("Failed to load assessment")
            else:
                required_assessment_fields = ['metadata', 'structure', 'responseGroups', 'scoring', 'interpretation']
                for field in required_assessment_fields:
                    if field not in assessment:
                        errors.append(f"Missing assessment field: {field}")
                        
                # Validate structure has items
                if 'structure' in assessment and 'sections' in assessment['structure']:
                    total_items = 0
                    for section in assessment['structure']['sections']:
                        if 'items' in section:
                            total_items += len(section['items'])
                    
                    if total_items == 0:
                        errors.append("No items found in assessment structure")
                    
                    # Check total items match
                    declared_total = assessment['structure'].get('totalItems', 0)
                    if declared_total != total_items:
                        errors.append(f"Total items mismatch: declared {declared_total}, found {total_items}")
        
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
        
        return len(errors) == 0, errors


# Singleton instance
template_loader = ScalesV3TemplateLoader()