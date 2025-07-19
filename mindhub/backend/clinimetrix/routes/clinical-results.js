/**
 * Clinical Results API Routes for Clinimetrix Hub
 * 
 * Comprehensive clinical results management for Task 3.4 completion,
 * including score calculations, interpretations, and reporting
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * GET /api/v1/clinimetrix/results/assessments/:assessmentId
 * Get clinical assessment results with interpretations
 */
router.get('/assessments/:assessmentId',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['read:clinical_assessments']),
  [
    param('assessmentId').isUUID().withMessage('Invalid assessment ID format'),
    query('includeInterpretation').optional().isBoolean(),
    query('includeRecommendations').optional().isBoolean(),
    query('format').optional().isIn(['json', 'clinical_report', 'summary'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { assessmentId } = req.params;
      const { 
        includeInterpretation = true, 
        includeRecommendations = true,
        format = 'json' 
      } = req.query;
      const userId = req.user?.id;

      // Get assessment with results
      const assessment = await executeQuery(
        (prisma) => prisma.scaleAdministration.findUnique({
          where: { id: assessmentId },
          include: {
            scale: {
              select: {
                id: true,
                name: true,
                version: true,
                scoringCriteria: true,
                interpretationGuide: true,
                normalRanges: true
              }
            },
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                gender: true
              }
            },
            administeredBy: {
              select: {
                id: true,
                name: true,
                role: true,
                professionalLicense: true
              }
            },
            responses: {
              select: {
                questionId: true,
                response: true,
                score: true,
                timestamp: true
              },
              orderBy: { questionId: 'asc' }
            }
          }
        }),
        `getAssessmentResults(${assessmentId})`
      );

      if (!assessment) {
        return res.status(404).json({
          error: 'Assessment not found',
          message: 'The specified assessment was not found'
        });
      }

      // Calculate comprehensive results
      const results = await calculateComprehensiveResults(assessment);
      
      // Generate clinical interpretation
      let interpretation = null;
      if (includeInterpretation) {
        interpretation = await generateClinicalInterpretation(assessment, results);
      }

      // Generate clinical recommendations
      let recommendations = null;
      if (includeRecommendations) {
        recommendations = await generateClinicalRecommendations(assessment, results, interpretation);
      }

      // Log results access
      await auditLogger.logDataAccess(
        userId,
        'clinical_assessment_results',
        assessmentId,
        'view',
        {
          assessmentId,
          scaleId: assessment.scale.id,
          patientId: assessment.patientId,
          includeInterpretation,
          includeRecommendations,
          format
        }
      );

      // Format response based on requested format
      const response = formatClinicalResults(assessment, results, interpretation, recommendations, format);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('Failed to get clinical assessment results', {
        error: error.message,
        assessmentId: req.params.assessmentId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Results retrieval failed',
        message: 'An error occurred while retrieving assessment results'
      });
    }
  }
);

/**
 * POST /api/v1/clinimetrix/results/interpretations
 * Generate clinical interpretation for assessment results
 */
router.post('/interpretations',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:clinical_assessments']),
  [
    body('assessmentId').isUUID().withMessage('Assessment ID is required'),
    body('scaleId').isString().withMessage('Scale ID is required'),
    body('totalScore').isNumeric().withMessage('Total score is required'),
    body('subscaleScores').optional().isObject(),
    body('contextualFactors').optional().isObject(),
    body('clinicalNotes').optional().isString().isLength({ max: 2000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        assessmentId,
        scaleId,
        totalScore,
        subscaleScores = {},
        contextualFactors = {},
        clinicalNotes
      } = req.body;
      const userId = req.user?.id;

      // Get scale information
      const scale = await executeQuery(
        (prisma) => prisma.scale.findUnique({
          where: { id: scaleId },
          select: {
            id: true,
            name: true,
            interpretationGuide: true,
            normalRanges: true,
            cutoffScores: true,
            clinicalGuidelines: true
          }
        }),
        `getScale(${scaleId})`
      );

      if (!scale) {
        return res.status(404).json({
          error: 'Scale not found',
          message: 'The specified scale was not found'
        });
      }

      // Generate comprehensive interpretation
      const interpretation = await generateAdvancedInterpretation(
        scale,
        totalScore,
        subscaleScores,
        contextualFactors,
        clinicalNotes
      );

      // Store interpretation
      const interpretationRecord = await executeQuery(
        (prisma) => prisma.clinicalInterpretation.create({
          data: {
            id: uuidv4(),
            assessmentId,
            scaleId,
            totalScore,
            subscaleScores,
            interpretation: interpretation.textInterpretation,
            severityLevel: interpretation.severityLevel,
            riskLevel: interpretation.riskLevel,
            clinicalRecommendations: interpretation.recommendations,
            contextualFactors,
            clinicalNotes,
            interpretedBy: userId,
            interpretedAt: new Date(),
            confidence: interpretation.confidence
          }
        }),
        'createClinicalInterpretation'
      );

      // Log interpretation creation
      await auditLogger.logDataModification(
        userId,
        'CLINICAL_INTERPRETATION_CREATE',
        {
          assessmentId,
          scaleId,
          totalScore,
          severityLevel: interpretation.severityLevel,
          riskLevel: interpretation.riskLevel,
          confidence: interpretation.confidence
        }
      );

      res.status(201).json({
        success: true,
        data: {
          interpretation: interpretationRecord,
          details: interpretation
        }
      });

    } catch (error) {
      logger.error('Failed to generate clinical interpretation', {
        error: error.message,
        assessmentId: req.body.assessmentId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Interpretation generation failed',
        message: 'An error occurred while generating clinical interpretation'
      });
    }
  }
);

/**
 * GET /api/v1/clinimetrix/results/reports/:patientId
 * Get comprehensive clinical assessment report for patient
 */
router.get('/reports/:patientId',
  ...middleware.utils.withPatientAccess(['psychiatrist', 'psychologist', 'admin'], ['read:clinical_assessments']),
  [
    param('patientId').isUUID().withMessage('Invalid patient ID format'),
    query('timeframe').optional().isIn(['30d', '90d', '180d', '1y', 'all']),
    query('scaleTypes').optional().isString(),
    query('includeGraphs').optional().isBoolean(),
    query('format').optional().isIn(['json', 'pdf', 'clinical_summary'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { patientId } = req.params;
      const { 
        timeframe = '90d',
        scaleTypes,
        includeGraphs = true,
        format = 'json'
      } = req.query;
      const userId = req.user?.id;

      // Calculate date range
      const dateRanges = {
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        '180d': new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        '1y': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        'all': new Date(0)
      };

      const fromDate = dateRanges[timeframe];

      // Get patient assessments
      const assessments = await executeQuery(
        (prisma) => prisma.scaleAdministration.findMany({
          where: {
            patientId,
            completedAt: {
              gte: fromDate
            },
            ...(scaleTypes && {
              scale: {
                category: {
                  in: scaleTypes.split(',')
                }
              }
            })
          },
          include: {
            scale: {
              select: {
                id: true,
                name: true,
                category: true,
                version: true,
                normalRanges: true
              }
            },
            responses: {
              select: {
                questionId: true,
                response: true,
                score: true
              }
            },
            interpretation: {
              select: {
                interpretation: true,
                severityLevel: true,
                riskLevel: true,
                clinicalRecommendations: true,
                confidence: true
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          }
        }),
        `getPatientAssessments(${patientId})`
      );

      // Generate comprehensive report
      const report = await generateComprehensiveReport(
        patientId,
        assessments,
        { timeframe, includeGraphs, format }
      );

      // Log report generation
      await auditLogger.logDataAccess(
        userId,
        'clinical_assessment_report',
        patientId,
        'generate',
        {
          patientId,
          timeframe,
          assessmentCount: assessments.length,
          scaleTypes,
          format
        }
      );

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Failed to generate clinical assessment report', {
        error: error.message,
        patientId: req.params.patientId,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Report generation failed',
        message: 'An error occurred while generating clinical assessment report'
      });
    }
  }
);

/**
 * Helper functions for clinical results processing
 */

async function calculateComprehensiveResults(assessment) {
  const totalScore = assessment.responses.reduce((sum, response) => sum + (response.score || 0), 0);
  
  // Calculate subscale scores if available
  const subscaleScores = {};
  if (assessment.scale.scoringCriteria && assessment.scale.scoringCriteria.subscales) {
    for (const subscale of assessment.scale.scoringCriteria.subscales) {
      const subscaleQuestions = subscale.questions || [];
      subscaleScores[subscale.name] = assessment.responses
        .filter(r => subscaleQuestions.includes(r.questionId))
        .reduce((sum, response) => sum + (response.score || 0), 0);
    }
  }

  // Calculate percentiles if normal ranges available
  let percentile = null;
  if (assessment.scale.normalRanges) {
    percentile = calculatePercentile(totalScore, assessment.scale.normalRanges);
  }

  return {
    totalScore,
    subscaleScores,
    percentile,
    responseCount: assessment.responses.length,
    completionRate: assessment.responses.length > 0 ? 100 : 0
  };
}

async function generateClinicalInterpretation(assessment, results) {
  const scale = assessment.scale;
  const totalScore = results.totalScore;

  // Basic severity classification
  let severityLevel = 'normal';
  let riskLevel = 'low';
  
  if (scale.interpretationGuide && scale.interpretationGuide.severityRanges) {
    for (const range of scale.interpretationGuide.severityRanges) {
      if (totalScore >= range.min && totalScore <= range.max) {
        severityLevel = range.severity;
        riskLevel = range.risk || 'low';
        break;
      }
    }
  }

  // Generate interpretation text
  const interpretation = {
    severityLevel,
    riskLevel,
    textInterpretation: generateInterpretationText(scale, totalScore, severityLevel, riskLevel),
    confidence: calculateInterpretationConfidence(assessment, results),
    clinicalSignificance: assessClinicalSignificance(totalScore, scale),
    recommendations: generateBasicRecommendations(severityLevel, riskLevel, scale)
  };

  return interpretation;
}

async function generateClinicalRecommendations(assessment, results, interpretation) {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: [],
    followUp: []
  };

  // Generate recommendations based on severity and risk
  if (interpretation.riskLevel === 'high') {
    recommendations.immediate.push('Consider immediate clinical consultation');
    recommendations.immediate.push('Assess for safety concerns');
  }

  if (interpretation.severityLevel === 'severe') {
    recommendations.shortTerm.push('Initiate appropriate treatment intervention');
    recommendations.shortTerm.push('Consider medication evaluation');
  }

  // Follow-up recommendations
  const followUpInterval = getFollowUpInterval(interpretation.severityLevel);
  recommendations.followUp.push(`Re-assess in ${followUpInterval}`);

  return recommendations;
}

function formatClinicalResults(assessment, results, interpretation, recommendations, format) {
  const baseData = {
    assessment: {
      id: assessment.id,
      scaleId: assessment.scale.id,
      scaleName: assessment.scale.name,
      patientId: assessment.patientId,
      completedAt: assessment.completedAt,
      administeredBy: assessment.administeredBy
    },
    results: results,
    interpretation: interpretation,
    recommendations: recommendations
  };

  switch (format) {
    case 'clinical_report':
      return generateClinicalReportFormat(baseData);
    case 'summary':
      return generateSummaryFormat(baseData);
    default:
      return baseData;
  }
}

function generateInterpretationText(scale, score, severity, risk) {
  return `Based on the ${scale.name} assessment, the total score of ${score} indicates ${severity} severity level with ${risk} risk classification. This suggests appropriate clinical attention and monitoring.`;
}

function calculateInterpretationConfidence(assessment, results) {
  // Calculate confidence based on completion rate and response consistency
  const completionRate = results.completionRate / 100;
  const responseConsistency = calculateResponseConsistency(assessment.responses);
  
  return Math.round((completionRate * 0.7 + responseConsistency * 0.3) * 100);
}

function calculateResponseConsistency(responses) {
  // Simple consistency check - could be enhanced with more sophisticated algorithms
  if (responses.length < 3) return 0.5;
  
  const scores = responses.map(r => r.score || 0);
  const variance = calculateVariance(scores);
  const maxVariance = Math.max(...scores) - Math.min(...scores);
  
  return maxVariance > 0 ? Math.max(0, 1 - (variance / maxVariance)) : 1;
}

function calculateVariance(numbers) {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}

function calculatePercentile(score, normalRanges) {
  if (!normalRanges || !normalRanges.distribution) return null;
  
  // Simple percentile calculation - could be enhanced with more sophisticated methods
  const distribution = normalRanges.distribution;
  const totalSamples = distribution.reduce((sum, point) => sum + point.frequency, 0);
  
  let cumulativeFreq = 0;
  for (const point of distribution) {
    cumulativeFreq += point.frequency;
    if (score <= point.score) {
      return Math.round((cumulativeFreq / totalSamples) * 100);
    }
  }
  
  return 99; // If score is higher than all reference points
}

function assessClinicalSignificance(score, scale) {
  if (!scale.cutoffScores) return 'indeterminate';
  
  if (score >= scale.cutoffScores.clinical) {
    return 'clinically_significant';
  } else if (score >= scale.cutoffScores.subclinical) {
    return 'subclinical';
  } else {
    return 'non_clinical';
  }
}

function generateBasicRecommendations(severity, risk, scale) {
  const recommendations = [];
  
  if (severity === 'severe' || risk === 'high') {
    recommendations.push('Consider immediate clinical intervention');
    recommendations.push('Assess for safety and crisis management needs');
  }
  
  if (severity === 'moderate') {
    recommendations.push('Regular monitoring and follow-up recommended');
    recommendations.push('Consider therapeutic interventions');
  }
  
  recommendations.push('Document results in patient medical record');
  
  return recommendations;
}

function getFollowUpInterval(severity) {
  const intervals = {
    'severe': '1-2 weeks',
    'moderate': '2-4 weeks',
    'mild': '4-6 weeks',
    'normal': '3-6 months'
  };
  
  return intervals[severity] || '4-6 weeks';
}

async function generateAdvancedInterpretation(scale, totalScore, subscaleScores, contextualFactors, clinicalNotes) {
  // Enhanced interpretation with contextual factors
  const baseInterpretation = await generateClinicalInterpretation(
    { scale, responses: [] },
    { totalScore, subscaleScores }
  );
  
  // Incorporate contextual factors
  const contextualAdjustments = assessContextualFactors(contextualFactors, totalScore);
  
  return {
    ...baseInterpretation,
    contextualAdjustments,
    clinicalNotes,
    confidence: Math.min(100, baseInterpretation.confidence + contextualAdjustments.confidenceBoost)
  };
}

function assessContextualFactors(contextualFactors, totalScore) {
  const adjustments = {
    confidenceBoost: 0,
    severityModifier: 0,
    additionalConsiderations: []
  };
  
  // Age considerations
  if (contextualFactors.age) {
    if (contextualFactors.age < 18) {
      adjustments.additionalConsiderations.push('Consider age-appropriate norms for adolescent population');
    } else if (contextualFactors.age > 65) {
      adjustments.additionalConsiderations.push('Consider age-related factors for elderly population');
    }
  }
  
  // Medication considerations
  if (contextualFactors.medications) {
    adjustments.additionalConsiderations.push('Consider potential medication effects on assessment results');
  }
  
  // Cultural considerations
  if (contextualFactors.culturalBackground) {
    adjustments.additionalConsiderations.push('Consider cultural factors in interpretation');
  }
  
  return adjustments;
}

async function generateComprehensiveReport(patientId, assessments, options) {
  const report = {
    patientId,
    generatedAt: new Date().toISOString(),
    timeframe: options.timeframe,
    assessmentCount: assessments.length,
    scalesSummary: {},
    trends: {},
    clinicalSummary: {},
    recommendations: []
  };
  
  // Group assessments by scale
  const assessmentsByScale = {};
  assessments.forEach(assessment => {
    const scaleId = assessment.scale.id;
    if (!assessmentsByScale[scaleId]) {
      assessmentsByScale[scaleId] = [];
    }
    assessmentsByScale[scaleId].push(assessment);
  });
  
  // Generate summary for each scale
  for (const [scaleId, scaleAssessments] of Object.entries(assessmentsByScale)) {
    const scale = scaleAssessments[0].scale;
    const scores = scaleAssessments.map(a => calculateTotalScore(a.responses));
    
    report.scalesSummary[scaleId] = {
      scaleName: scale.name,
      assessmentCount: scaleAssessments.length,
      latestScore: scores[0],
      averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      scoreRange: {
        min: Math.min(...scores),
        max: Math.max(...scores)
      },
      trend: calculateTrend(scores)
    };
  }
  
  // Generate overall clinical summary
  report.clinicalSummary = generateClinicalSummary(assessments);
  
  return report;
}

function calculateTotalScore(responses) {
  return responses.reduce((sum, response) => sum + (response.score || 0), 0);
}

function calculateTrend(scores) {
  if (scores.length < 2) return 'insufficient_data';
  
  const firstScore = scores[scores.length - 1];
  const lastScore = scores[0];
  const change = lastScore - firstScore;
  
  if (Math.abs(change) < 2) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
}

function generateClinicalSummary(assessments) {
  const summary = {
    totalAssessments: assessments.length,
    uniqueScales: new Set(assessments.map(a => a.scale.id)).size,
    latestAssessment: assessments[0]?.completedAt,
    overallTrend: 'stable',
    clinicalAlerts: []
  };
  
  // Check for clinical alerts
  assessments.forEach(assessment => {
    if (assessment.interpretation?.riskLevel === 'high') {
      summary.clinicalAlerts.push({
        type: 'high_risk',
        scaleId: assessment.scale.id,
        scaleName: assessment.scale.name,
        date: assessment.completedAt
      });
    }
  });
  
  return summary;
}

function generateClinicalReportFormat(data) {
  return {
    reportType: 'clinical_assessment_report',
    patient: data.assessment.patientId,
    assessment: {
      scale: data.assessment.scaleName,
      date: data.assessment.completedAt,
      administrator: data.assessment.administeredBy.name
    },
    results: {
      totalScore: data.results.totalScore,
      interpretation: data.interpretation?.textInterpretation,
      severity: data.interpretation?.severityLevel,
      risk: data.interpretation?.riskLevel,
      confidence: data.interpretation?.confidence
    },
    recommendations: data.recommendations,
    clinicalNotes: data.interpretation?.clinicalNotes
  };
}

function generateSummaryFormat(data) {
  return {
    score: data.results.totalScore,
    severity: data.interpretation?.severityLevel,
    risk: data.interpretation?.riskLevel,
    interpretation: data.interpretation?.textInterpretation,
    keyRecommendations: data.recommendations?.immediate || []
  };
}

module.exports = router;