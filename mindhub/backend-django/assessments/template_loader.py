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
        # Try multiple possible paths for scalesV3 directory
        possible_paths = [
            Path(settings.BASE_DIR) / 'scalesV3',  # Local development
            Path(settings.BASE_DIR) / 'static' / 'scalesV3',  # Django static files
            Path(settings.BASE_DIR).parent / 'scalesV3',  # Parent directory
            Path('/var/task/scalesV3'),  # Vercel serverless path
            Path('/var/task/static/scalesV3'),  # Vercel serverless static
            Path('/opt/build/repo/scalesV3'),  # Alternative deployment path
            Path('/opt/build/repo/static/scalesV3'),  # Alternative static path
        ]
        
        self.scales_dir = None
        for path in possible_paths:
            if path.exists() and path.is_dir():
                self.scales_dir = path
                logger.info(f"ScalesV3 directory found at: {path}")
                break
        
        if not self.scales_dir:
            logger.error(f"ScalesV3 directory not found. Checked paths: {possible_paths}")
            logger.error(f"BASE_DIR is: {settings.BASE_DIR}")
            logger.error(f"Current working directory is: {Path.cwd()}")
            
            # Enhanced debugging for production
            for i, path in enumerate(possible_paths):
                logger.error(f"Path {i+1}: {path} - Exists: {path.exists()} - Is dir: {path.is_dir() if path.exists() else 'N/A'}")
                if path.parent.exists():
                    try:
                        parent_contents = list(path.parent.iterdir())
                        logger.error(f"Parent dir ({path.parent}) contents: {[p.name for p in parent_contents]}")
                    except Exception as e:
                        logger.error(f"Could not list parent contents: {e}")
            
            # List contents of BASE_DIR for debugging
            try:
                base_contents = list(Path(settings.BASE_DIR).iterdir())
                logger.error(f"Contents of BASE_DIR: {[p.name for p in base_contents]}")
                
                # Also check static directory
                static_dir = Path(settings.BASE_DIR) / 'static'
                if static_dir.exists():
                    static_contents = list(static_dir.iterdir())
                    logger.error(f"Contents of static dir: {[p.name for p in static_contents]}")
            except Exception as e:
                logger.error(f"Could not list directory contents: {e}")
        
        self.cache_timeout = 60 * 60  # 1 hour cache
        
        # If still no directory found, use fallback embedded data for critical scales
        if not self.scales_dir:
            logger.warning("Using embedded fallback scale data as scalesV3 directory not found")
        
    def get_available_scales(self) -> List[Dict]:
        """
        Get list of all available scales with their metadata
        """
        if not self.scales_dir:
            logger.error("No scales directory available, using fallback scales")
            return self._get_fallback_scales()
            
        cache_key = 'scalesv3_available_scales'
        cached_scales = cache.get(cache_key)
        
        if cached_scales:
            return cached_scales
            
        scales = []
        
        try:
            catalog_files = list(self.scales_dir.glob('*-catalog.json'))
            logger.info(f"Found {len(catalog_files)} catalog files in {self.scales_dir}")
            
            for catalog_file in catalog_files:
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
        except Exception as e:
            logger.error(f"Error scanning scales directory: {str(e)}")
            return []
        
        # Sort by category, then name
        scales.sort(key=lambda x: (x['category'], x['name']))
        
        cache.set(cache_key, scales, self.cache_timeout)
        return scales
    
    def get_scale_template(self, scale_id: str) -> Optional[Dict]:
        """
        Get complete template for a scale (catalog + assessment combined)
        """
        if not self.scales_dir:
            logger.warning(f"No scales directory available, cannot load template for {scale_id}")
            return self._get_fallback_template(scale_id)
            
        cache_key = f'scalesv3_template_{scale_id}'
        cached_template = cache.get(cache_key)
        
        if cached_template:
            return cached_template
            
        try:
            catalog = self._load_catalog(scale_id)
            assessment = self._load_assessment(scale_id)
            
            if not catalog or not assessment:
                logger.warning(f"Could not load files for {scale_id}, trying fallback")
                return self._get_fallback_template(scale_id)
            
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
        if not self.scales_dir:
            logger.error("No scales directory available for loading catalog")
            return None
            
        catalog_file = self.scales_dir / f'{scale_id}-catalog.json'
        
        if not catalog_file.exists():
            logger.warning(f"Catalog file not found: {catalog_file}")
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
        if not self.scales_dir:
            logger.error("No scales directory available for loading assessment")
            return None
            
        assessment_file = self.scales_dir / f'{scale_id}-assessment.json'
        
        if not assessment_file.exists():
            logger.warning(f"Assessment file not found: {assessment_file}")
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

    def _get_fallback_scales(self) -> List[Dict]:
        """
        Fallback scales when scalesV3 directory is not accessible
        """
        return [
            {
                'id': 'phq9',
                'template_id': 'phq9',
                'name': 'Patient Health Questionnaire-9',
                'abbreviation': 'PHQ-9',
                'version': '1.0',
                'category': 'Depression',
                'subcategory': '',
                'description': 'Cuestionario de 9 ítems para evaluar la severidad de la depresión',
                'authors': ['Kroenke, K.', 'Spitzer, R.L.', 'Williams, J.B.'],
                'year': '2001',
                'language': 'es',
                'administrationMode': 'self',
                'estimatedDurationMinutes': 5,
                'targetPopulation': {
                    'ageGroups': ['18-65', '65+'],
                    'demographics': 'Adultos',
                    'clinicalConditions': ['Depression', 'Primary care screening']
                },
                'isActive': True,
                'isFeatured': True,
                'lastUpdated': '2025-01-01'
            },
            {
                'id': 'gadi',
                'template_id': 'gadi',
                'name': 'Generalized Anxiety Disorder Index',
                'abbreviation': 'GADI',
                'version': '1.0',
                'category': 'Anxiety',
                'subcategory': '',
                'description': 'Índice para evaluar el trastorno de ansiedad generalizada',
                'authors': ['Rodriguez-Biglieri, R.', 'Vetere, G.L.'],
                'year': '2011',
                'language': 'es',
                'administrationMode': 'self',
                'estimatedDurationMinutes': 7,
                'targetPopulation': {
                    'ageGroups': ['18-65'],
                    'demographics': 'Adultos',
                    'clinicalConditions': ['Anxiety', 'Generalized anxiety disorder']
                },
                'isActive': True,
                'isFeatured': True,
                'lastUpdated': '2025-01-01'
            }
        ]

    def _get_fallback_template(self, scale_id: str) -> Optional[Dict]:
        """
        Get fallback template for critical scales
        """
        if scale_id == 'phq9':
            return {
                'metadata': {
                    'id': 'phq9',
                    'name': 'Patient Health Questionnaire-9',
                    'abbreviation': 'PHQ-9',
                    'version': '1.0',
                    'category': 'Depression',
                    'description': 'Cuestionario de 9 ítems para evaluar la severidad de la depresión',
                    'authors': ['Kroenke, K.', 'Spitzer, R.L.', 'Williams, J.B.'],
                    'year': '2001',
                    'language': 'es',
                    'administrationMode': 'self',
                    'estimatedDurationMinutes': 5,
                    'targetPopulation': {
                        'ageGroups': ['18-65', '65+'],
                        'demographics': 'Adultos',
                        'clinicalConditions': ['Depression', 'Primary care screening']
                    },
                    'helpText': {
                        'general': 'Cuestionario para evaluar síntomas de depresión',
                        'instructions': {
                            'professional': 'Aplicar según protocolo clínico',
                            'patient': 'Responda según cómo se ha sentido en las últimas 2 semanas'
                        }
                    }
                },
                'structure': {
                    'totalItems': 9,
                    'sections': [{
                        'id': 'main',
                        'title': 'Síntomas de Depresión',
                        'order': 1,
                        'items': [
                            {
                                'number': 1,
                                'id': 'phq9_1',
                                'text': 'Poco interés o placer en hacer cosas',
                                'responseType': 'likert',
                                'required': True,
                                'reversed': False,
                                'responseGroup': 'phq9_likert'
                            }
                            # Add more items as needed
                        ]
                    }]
                },
                'responseGroups': {
                    'phq9_likert': [
                        {'value': 0, 'label': 'Nunca', 'score': 0},
                        {'value': 1, 'label': 'Varios días', 'score': 1},
                        {'value': 2, 'label': 'Más de la mitad de los días', 'score': 2},
                        {'value': 3, 'label': 'Casi todos los días', 'score': 3}
                    ]
                },
                'scoring': {
                    'method': 'sum',
                    'scoreRange': {'min': 0, 'max': 27}
                },
                'interpretation': {
                    'rules': [
                        {'id': 'minimal', 'minScore': 0, 'maxScore': 4, 'label': 'Mínima', 'severity': 'minimal', 'color': '#22c55e', 'clinicalInterpretation': 'Sin depresión clínicamente significativa'},
                        {'id': 'mild', 'minScore': 5, 'maxScore': 9, 'label': 'Leve', 'severity': 'mild', 'color': '#eab308', 'clinicalInterpretation': 'Depresión leve'},
                        {'id': 'moderate', 'minScore': 10, 'maxScore': 14, 'label': 'Moderada', 'severity': 'moderate', 'color': '#f97316', 'clinicalInterpretation': 'Depresión moderada'},
                        {'id': 'severe', 'minScore': 15, 'maxScore': 27, 'label': 'Severa', 'severity': 'severe', 'color': '#ef4444', 'clinicalInterpretation': 'Depresión severa'}
                    ]
                }
            }
        
        logger.warning(f"No fallback template available for {scale_id}")
        return None


# Singleton instance
template_loader = ScalesV3TemplateLoader()