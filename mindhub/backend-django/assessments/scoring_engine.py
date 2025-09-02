"""
ScalesV3 Scoring Engine
Calculates scores and interpretations for JSON-based scale templates
"""

import logging
from typing import Dict, List, Optional, Any
from django.utils import timezone
import statistics

logger = logging.getLogger(__name__)

class ScalesV3ScoringEngine:
    """
    Scoring engine for ScalesV3 JSON templates
    Handles scoring, interpretation, and validity analysis
    """
    
    def __init__(self, template: Dict):
        self.template = template
        self.metadata = template['metadata']
        self.structure = template['structure']
        self.response_groups = template['responseGroups']
        self.scoring_config = template['scoring']
        self.interpretation_config = template['interpretation']
        
    def calculate_scores(self, responses: Dict[str, Any], demographics: Dict[str, Any] = None) -> Dict:
        """
        Calculate complete scoring results for given responses
        """
        try:
            # Validate responses
            validation_result = self._validate_responses(responses)
            if not validation_result['isValid']:
                raise ValueError(f"Invalid responses: {validation_result['errors']}")
            
            # Calculate raw scores
            raw_scores = self._calculate_raw_scores(responses)
            
            # Calculate subscale scores if applicable
            subscale_scores = self._calculate_subscale_scores(responses)
            
            # Get interpretation
            interpretation = self._get_interpretation(raw_scores['totalScore'], subscale_scores)
            
            # Calculate validity indicators
            validity_indicators = self._calculate_validity_indicators(responses)
            
            # Calculate percentiles if normative data available
            percentiles = self._calculate_percentiles(raw_scores['totalScore'], demographics)
            
            return {
                'templateId': self.metadata['id'],
                'templateVersion': self.metadata['version'],
                'scores': {
                    'totalScore': raw_scores['totalScore'],
                    'scoreRange': {
                        'min': self.scoring_config['scoreRange']['min'],
                        'max': self.scoring_config['scoreRange']['max']
                    },
                    'subscaleScores': subscale_scores,
                    'rawScores': raw_scores
                },
                'interpretation': interpretation,
                'validityIndicators': validity_indicators,
                'percentiles': percentiles,
                'demographics': demographics or {},
                'completionMetrics': {
                    'totalItems': self.structure['totalItems'],
                    'respondedItems': len(responses),
                    'completionRate': len(responses) / self.structure['totalItems']
                },
                'analysisTimestamp': timezone.now().isoformat(),
                'scoringAlgorithm': 'scalesv3-engine-1.0'
            }
            
        except Exception as e:
            logger.error(f"Error calculating scores: {str(e)}")
            raise
    
    def _validate_responses(self, responses: Dict[str, Any]) -> Dict:
        """
        Validate responses against template structure
        """
        errors = []
        warnings = []
        
        # Get all items from structure
        all_items = []
        for section in self.structure['sections']:
            all_items.extend(section['items'])
        
        # Check required items
        required_items = [item for item in all_items if item.get('required', False)]
        for item in required_items:
            item_id = item['id']
            if item_id not in responses or responses[item_id] is None:
                errors.append(f"Required item {item['number']} ({item_id}) is missing")
        
        # Validate response values
        for item_id, response_value in responses.items():
            # Find item in structure
            item = next((item for item in all_items if item['id'] == item_id), None)
            if not item:
                warnings.append(f"Response for unknown item: {item_id}")
                continue
            
            # Validate against response group
            response_group = item.get('responseGroup')
            if response_group and response_group in self.response_groups:
                valid_values = [opt['value'] for opt in self.response_groups[response_group]]
                if response_value not in valid_values:
                    errors.append(f"Invalid value {response_value} for item {item['number']}")
        
        return {
            'isValid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def _calculate_raw_scores(self, responses: Dict[str, Any]) -> Dict:
        """
        Calculate raw scores based on scoring method
        """
        scoring_method = self.scoring_config.get('method', 'sum')
        
        if scoring_method == 'sum':
            return self._calculate_sum_scores(responses)
        elif scoring_method == 'average':
            return self._calculate_average_scores(responses)
        elif scoring_method == 'weighted':
            return self._calculate_weighted_scores(responses)
        else:
            raise ValueError(f"Unsupported scoring method: {scoring_method}")
    
    def _calculate_sum_scores(self, responses: Dict[str, Any]) -> Dict:
        """
        Calculate scores using sum method
        """
        total_score = 0
        item_scores = {}
        
        # Get all items
        all_items = []
        for section in self.structure['sections']:
            all_items.extend(section['items'])
        
        for item in all_items:
            item_id = item['id']
            if item_id in responses:
                response_value = responses[item_id]
                
                # Get score from response group
                response_group = item.get('responseGroup')
                if response_group and response_group in self.response_groups:
                    score = next(
                        (opt['score'] for opt in self.response_groups[response_group] 
                         if opt['value'] == response_value), 
                        0
                    )
                else:
                    score = response_value  # Direct score
                
                # Apply reverse scoring if needed
                if item.get('reversed', False):
                    max_score = max(opt['score'] for opt in self.response_groups[response_group])
                    min_score = min(opt['score'] for opt in self.response_groups[response_group])
                    score = max_score - score + min_score
                
                item_scores[item_id] = score
                
                # Only sum items that contribute to total (exclude functional items)
                if not item.get('excludeFromTotal', False):
                    total_score += score
        
        return {
            'totalScore': total_score,
            'itemScores': item_scores
        }
    
    def _calculate_average_scores(self, responses: Dict[str, Any]) -> Dict:
        """
        Calculate scores using average method
        """
        sum_result = self._calculate_sum_scores(responses)
        item_count = len([score for score in sum_result['itemScores'].values() if score > 0])
        
        avg_score = sum_result['totalScore'] / item_count if item_count > 0 else 0
        
        return {
            'totalScore': round(avg_score, 2),
            'itemScores': sum_result['itemScores'],
            'averageScore': avg_score
        }
    
    def _calculate_weighted_scores(self, responses: Dict[str, Any]) -> Dict:
        """
        Calculate weighted scores (if weights specified in template)
        """
        # For now, fallback to sum method
        # TODO: Implement when we have templates with weights
        return self._calculate_sum_scores(responses)
    
    def _calculate_subscale_scores(self, responses: Dict[str, Any]) -> Dict:
        """
        Calculate subscale scores if defined
        """
        subscale_scores = {}
        
        # Check if template has subscales
        subscales = self.scoring_config.get('subscales', [])
        if not subscales:
            return subscale_scores
        
        # Get all items
        all_items = []
        for section in self.structure['sections']:
            all_items.extend(section['items'])
        
        for subscale in subscales:
            subscale_id = subscale['id']
            subscale_items = subscale.get('items', [])
            
            subscale_total = 0
            subscale_item_count = 0
            
            for item in all_items:
                if item['id'] in subscale_items and item['id'] in responses:
                    response_value = responses[item['id']]
                    
                    # Get score
                    response_group = item.get('responseGroup')
                    if response_group and response_group in self.response_groups:
                        score = next(
                            (opt['score'] for opt in self.response_groups[response_group] 
                             if opt['value'] == response_value), 
                            0
                        )
                    else:
                        score = response_value
                    
                    # Apply reverse scoring if needed
                    if item.get('reversed', False):
                        max_score = max(opt['score'] for opt in self.response_groups[response_group])
                        min_score = min(opt['score'] for opt in self.response_groups[response_group])
                        score = max_score - score + min_score
                    
                    subscale_total += score
                    subscale_item_count += 1
            
            subscale_scores[subscale_id] = {
                'name': subscale.get('name', subscale_id),
                'score': subscale_total,
                'itemCount': subscale_item_count,
                'scoreRange': subscale.get('scoreRange', {'min': 0, 'max': subscale_total})
            }
        
        return subscale_scores
    
    def _get_interpretation(self, total_score: float, subscale_scores: Dict) -> Dict:
        """
        Get interpretation based on score ranges
        """
        interpretation_rules = self.interpretation_config.get('rules', [])
        clinical_interpretation = self.interpretation_config.get('clinicalInterpretation', {})
        
        # Find matching rule
        matching_rule = None
        for rule in interpretation_rules:
            if rule['minScore'] <= total_score <= rule['maxScore']:
                matching_rule = rule
                break
        
        if not matching_rule:
            # Default rule for out-of-range scores
            matching_rule = {
                'id': 'out-of-range',
                'label': 'Score out of range',
                'severity': 'unknown',
                'color': '#6B7280',
                'clinicalInterpretation': 'Score is outside expected range'
            }
        
        # Get detailed interpretation if available
        detailed_rule = None
        if clinical_interpretation.get('detailedRules'):
            for rule in clinical_interpretation['detailedRules']:
                if rule['minScore'] <= total_score <= rule['maxScore']:
                    detailed_rule = rule
                    break
        
        result = {
            'rule': matching_rule,
            'totalScore': total_score,
            'severity': matching_rule.get('severity', 'unknown'),
            'label': matching_rule.get('label', ''),
            'color': matching_rule.get('color', '#6B7280'),
            'clinicalInterpretation': matching_rule.get('clinicalInterpretation', ''),
        }
        
        # Add detailed interpretation if available
        if detailed_rule:
            result.update({
                'clinicalSignificance': detailed_rule.get('clinicalSignificance', ''),
                'differentialConsiderations': detailed_rule.get('differentialConsiderations', ''),
                'professionalRecommendations': detailed_rule.get('professionalRecommendations', {}),
                'prognosticImplications': detailed_rule.get('prognosticImplications', '')
            })
        
        # Add subscale interpretations
        if subscale_scores:
            result['subscaleInterpretations'] = self._get_subscale_interpretations(subscale_scores)
        
        return result
    
    def _get_subscale_interpretations(self, subscale_scores: Dict) -> Dict:
        """
        Get interpretations for subscale scores
        """
        # This would be implemented based on subscale interpretation rules
        # For now, return basic severity categorization
        subscale_interpretations = {}
        
        for subscale_id, subscale_data in subscale_scores.items():
            score = subscale_data['score']
            score_range = subscale_data['scoreRange']
            
            # Basic severity categorization based on percentiles
            max_score = score_range['max']
            if score <= max_score * 0.25:
                severity = 'minimal'
            elif score <= max_score * 0.5:
                severity = 'mild'
            elif score <= max_score * 0.75:
                severity = 'moderate'
            else:
                severity = 'severe'
            
            subscale_interpretations[subscale_id] = {
                'score': score,
                'severity': severity,
                'percentile': (score / max_score) * 100 if max_score > 0 else 0
            }
        
        return subscale_interpretations
    
    def _calculate_validity_indicators(self, responses: Dict[str, Any]) -> Dict:
        """
        Calculate response validity indicators
        """
        if not responses:
            return {'overallValidityScore': 0, 'validityLevel': 'invalid'}
        
        response_values = list(responses.values())
        
        # Basic statistics
        mean_response = statistics.mean(response_values) if response_values else 0
        stdev = statistics.stdev(response_values) if len(response_values) > 1 else 0
        
        # Response pattern analysis
        unique_responses = len(set(response_values))
        total_responses = len(response_values)
        
        # Detect extreme patterns
        constant_response = unique_responses == 1
        low_variability = stdev < 0.5 and total_responses > 5
        extreme_response_bias = all(v in [min(response_values), max(response_values)] for v in response_values)
        
        # Calculate validity score
        validity_score = 100
        flags = []
        
        if constant_response:
            validity_score -= 30
            flags.append('constant_response')
        
        if low_variability:
            validity_score -= 15
            flags.append('low_variability')
        
        if extreme_response_bias and not constant_response:
            validity_score -= 20
            flags.append('extreme_response_bias')
        
        # Determine validity level
        if validity_score >= 80:
            validity_level = 'high'
        elif validity_score >= 60:
            validity_level = 'moderate'
        elif validity_score >= 40:
            validity_level = 'low'
        else:
            validity_level = 'questionable'
        
        return {
            'overallValidityScore': max(validity_score, 0),
            'validityLevel': validity_level,
            'responsePatterns': {
                'constantResponse': constant_response,
                'lowVariability': low_variability,
                'extremeResponseBias': extreme_response_bias,
                'uniqueResponseRatio': unique_responses / total_responses if total_responses > 0 else 0
            },
            'statistics': {
                'mean': round(mean_response, 2),
                'standardDeviation': round(stdev, 2),
                'uniqueValues': unique_responses,
                'totalResponses': total_responses
            },
            'flags': flags,
            'warnings': self._generate_validity_warnings(flags)
        }
    
    def _generate_validity_warnings(self, flags: List[str]) -> List[Dict]:
        """
        Generate validity warnings based on flags
        """
        warnings = []
        
        warning_messages = {
            'constant_response': {
                'type': 'response_pattern',
                'severity': 'high',
                'message': 'All responses are identical - may indicate lack of engagement or understanding',
                'recommendation': 'Review administration conditions and consider re-administering'
            },
            'low_variability': {
                'type': 'response_pattern',
                'severity': 'medium',
                'message': 'Very low response variability detected',
                'recommendation': 'Check for understanding of response scale'
            },
            'extreme_response_bias': {
                'type': 'response_pattern',
                'severity': 'medium',
                'message': 'Extreme response bias detected - only using endpoints of scale',
                'recommendation': 'Consider cultural factors or response style bias'
            }
        }
        
        for flag in flags:
            if flag in warning_messages:
                warnings.append(warning_messages[flag])
        
        return warnings
    
    def _calculate_percentiles(self, total_score: float, demographics: Dict) -> Dict:
        """
        Calculate percentiles based on normative data if available
        """
        # Check if template has normative data
        normative_data = self.metadata.get('normativeData', {})
        if not normative_data or 'populationNorms' not in normative_data:
            return {}
        
        # For now, return basic percentile estimation
        # In a full implementation, this would use actual normative tables
        population_norms = normative_data['populationNorms']
        
        # Try to find matching demographic group
        if 'general' in population_norms:
            general_norms = population_norms['general']
            # Extract mean from string like "Media: 3.2 (DE=4.7, rango intercuartil: 1-4)"
            try:
                if 'Media:' in general_norms:
                    mean_str = general_norms.split('Media:')[1].split('(')[0].strip()
                    population_mean = float(mean_str)
                    
                    # Simple percentile estimation (would use proper normative tables in production)
                    if total_score <= population_mean * 0.5:
                        percentile = 25
                    elif total_score <= population_mean:
                        percentile = 50
                    elif total_score <= population_mean * 1.5:
                        percentile = 75
                    else:
                        percentile = 90
                    
                    return {
                        'percentile': percentile,
                        'populationMean': population_mean,
                        'comparedTo': 'general_population'
                    }
            except:
                pass
        
        return {}