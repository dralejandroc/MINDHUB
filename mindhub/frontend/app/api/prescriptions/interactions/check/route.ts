/**
 * 🔍 DRUG INTERACTIONS CHECKER API
 * 
 * Validación de interacciones medicamentosas y alertas de seguridad
 * Sistema preventivo para recetas médicas seguras
 */

import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';
import { resolveTenantContext } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

interface InteractionCheckRequest {
  medications: Array<{
    medication_name: string;
    active_ingredient?: string;
    dosage?: string;
    frequency?: string;
  }>;
  patient_allergies?: string[];
  patient_conditions?: string[];
  patient_age?: number;
}

interface InteractionResult {
  has_interactions: boolean;
  interactions: Array<{
    type: 'drug-drug' | 'drug-allergy' | 'drug-condition' | 'drug-age';
    severity: 'low' | 'moderate' | 'high' | 'critical';
    description: string;
    recommendation: string;
    medications_involved: string[];
    factor?: string; // Para alergias, condiciones, edad
  }>;
  warnings: Array<{
    type: 'controlled-substance' | 'duplicate-therapy' | 'dosage-alert' | 'age-inappropriate';
    message: string;
    medication: string;
  }>;
  safety_score: number; // 0-100, donde 100 es completamente seguro
}

/**
 * POST /api/prescriptions/interactions/check - Verificar interacciones medicamentosas
 */
export async function POST(request: Request) {
  try {
    console.log('[INTERACTIONS CHECK] Processing drug interactions check');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const body: InteractionCheckRequest = await request.json();
    
    if (!body.medications || body.medications.length === 0) {
      return createErrorResponse(
        'Invalid request',
        'At least one medication is required for interaction checking',
        400
      );
    }

    console.log('[INTERACTIONS CHECK] Checking', body.medications.length, 'medications');

    const result: InteractionResult = {
      has_interactions: false,
      interactions: [],
      warnings: [],
      safety_score: 100
    };

    // 1. Verificar interacciones medicamento-medicamento
    await checkDrugDrugInteractions(body.medications, result);
    
    // 2. Verificar interacciones medicamento-alergia
    if (body.patient_allergies) {
      await checkDrugAllergyInteractions(body.medications, body.patient_allergies, result);
    }
    
    // 3. Verificar interacciones medicamento-condición médica
    if (body.patient_conditions) {
      await checkDrugConditionInteractions(body.medications, body.patient_conditions, result);
    }
    
    // 4. Verificar medicamentos controlados y alertas especiales
    await checkControlledSubstancesAndWarnings(body.medications, result);
    
    // 5. Verificar duplicidad terapéutica
    await checkDuplicateTherapy(body.medications, result);
    
    // 6. Verificar apropiación por edad
    if (body.patient_age) {
      await checkAgeAppropriateness(body.medications, body.patient_age, result);
    }
    
    // 7. Calcular puntaje de seguridad final
    result.safety_score = calculateSafetyScore(result);
    result.has_interactions = result.interactions.length > 0;

    console.log('[INTERACTIONS CHECK] Analysis complete:', {
      interactions_found: result.interactions.length,
      warnings: result.warnings.length,
      safety_score: result.safety_score
    });

    return createResponse({
      success: true,
      data: result,
      message: result.has_interactions ? 
        'Interactions found - review recommendations' : 
        'No significant interactions detected'
    });

  } catch (error) {
    console.error('[INTERACTIONS CHECK] Error:', error);
    return createErrorResponse(
      'Failed to check interactions',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * Verificar interacciones medicamento-medicamento
 */
async function checkDrugDrugInteractions(
  medications: any[], 
  result: InteractionResult
) {
  // Base de datos de interacciones comunes (en producción sería una base más completa)
  const knownInteractions: Record<string, Array<{
    with: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>> = {
    'warfarina': [
      {
        with: 'aspirina',
        severity: 'high',
        description: 'Riesgo aumentado de sangrado por efecto anticoagulante combinado',
        recommendation: 'Monitorear INR frecuentemente. Considerar alternativas o ajustar dosis.'
      },
      {
        with: 'ibuprofeno',
        severity: 'moderate',
        description: 'AINEs pueden aumentar el riesgo de sangrado con anticoagulantes',
        recommendation: 'Usar con precaución. Preferir paracetamol para analgesia.'
      }
    ],
    'digoxina': [
      {
        with: 'furosemida',
        severity: 'moderate',
        description: 'Diuréticos pueden causar hipopotasemia, aumentando toxicidad de digoxina',
        recommendation: 'Monitorear niveles de potasio y digoxina sérica.'
      }
    ],
    'metformina': [
      {
        with: 'captopril',
        severity: 'low',
        description: 'Ambos pueden afectar función renal, requiere monitoreo',
        recommendation: 'Vigilar función renal periódicamente.'
      }
    ]
  };

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i].medication_name.toLowerCase();
      const med2 = medications[j].medication_name.toLowerCase();
      
      // Buscar interacciones conocidas
      const interactions1 = knownInteractions[med1];
      const interactions2 = knownInteractions[med2];
      
      if (interactions1) {
        const interaction = interactions1.find(int => 
          med2.includes(int.with) || int.with.includes(med2)
        );
        
        if (interaction) {
          result.interactions.push({
            type: 'drug-drug',
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation,
            medications_involved: [medications[i].medication_name, medications[j].medication_name]
          });
        }
      }
      
      if (interactions2) {
        const interaction = interactions2.find(int => 
          med1.includes(int.with) || int.with.includes(med1)
        );
        
        if (interaction) {
          result.interactions.push({
            type: 'drug-drug',
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation,
            medications_involved: [medications[j].medication_name, medications[i].medication_name]
          });
        }
      }
    }
  }
}

/**
 * Verificar interacciones medicamento-alergia
 */
async function checkDrugAllergyInteractions(
  medications: any[], 
  allergies: string[], 
  result: InteractionResult
) {
  // Mapeo de alergias comunes a grupos de medicamentos
  const allergyMap: Record<string, Array<{
    medication_group: string;
    severity: 'high' | 'critical';
    description: string;
  }>> = {
    'penicilina': [
      {
        medication_group: 'amoxicilina',
        severity: 'critical',
        description: 'Alergia cruzada con penicilinas - riesgo de anafilaxia'
      },
      {
        medication_group: 'ampicilina',
        severity: 'critical', 
        description: 'Alergia cruzada con penicilinas - riesgo de anafilaxia'
      }
    ],
    'sulfa': [
      {
        medication_group: 'sulfametoxazol',
        severity: 'high',
        description: 'Alergia a sulfamidas - riesgo de reacción cutánea grave'
      }
    ],
    'aspirina': [
      {
        medication_group: 'ibuprofeno',
        severity: 'high',
        description: 'Alergia cruzada con AINEs - riesgo de broncoespasmo'
      }
    ]
  };

  for (const allergy of allergies) {
    const allergyLower = allergy.toLowerCase();
    const allergyData = allergyMap[allergyLower];
    
    if (allergyData) {
      for (const medication of medications) {
        const medName = medication.medication_name.toLowerCase();
        
        for (const allergyInfo of allergyData) {
          if (medName.includes(allergyInfo.medication_group)) {
            result.interactions.push({
              type: 'drug-allergy',
              severity: allergyInfo.severity,
              description: allergyInfo.description,
              recommendation: 'CONTRAINDICADO - Usar medicamento alternativo',
              medications_involved: [medication.medication_name],
              factor: allergy
            });
          }
        }
      }
    }
  }
}

/**
 * Verificar interacciones medicamento-condición médica
 */
async function checkDrugConditionInteractions(
  medications: any[], 
  conditions: string[], 
  result: InteractionResult
) {
  // Condiciones que pueden contraindicar ciertos medicamentos
  const conditionInteractions: Record<string, Array<{
    medication: string;
    severity: 'moderate' | 'high';
    description: string;
    recommendation: string;
  }>> = {
    'insuficiencia renal': [
      {
        medication: 'metformina',
        severity: 'high',
        description: 'Metformina contraindicada en insuficiencia renal severa',
        recommendation: 'Evaluar función renal. Considerar insulina si es necesario.'
      }
    ],
    'asma': [
      {
        medication: 'propranolol',
        severity: 'high',
        description: 'Beta bloqueadores pueden precipitar broncoespasmo',
        recommendation: 'Usar beta bloqueadores cardioselectivos o alternativas.'
      }
    ],
    'hipertension': [
      {
        medication: 'ibuprofeno',
        severity: 'moderate',
        description: 'AINEs pueden elevar presión arterial',
        recommendation: 'Usar con precaución. Monitorear presión arterial.'
      }
    ]
  };

  for (const condition of conditions) {
    const conditionLower = condition.toLowerCase();
    const conditionData = conditionInteractions[conditionLower];
    
    if (conditionData) {
      for (const medication of medications) {
        const medName = medication.medication_name.toLowerCase();
        
        for (const interaction of conditionData) {
          if (medName.includes(interaction.medication.toLowerCase())) {
            result.interactions.push({
              type: 'drug-condition',
              severity: interaction.severity,
              description: interaction.description,
              recommendation: interaction.recommendation,
              medications_involved: [medication.medication_name],
              factor: condition
            });
          }
        }
      }
    }
  }
}

/**
 * Verificar medicamentos controlados y alertas especiales
 */
async function checkControlledSubstancesAndWarnings(
  medications: any[], 
  result: InteractionResult
) {
  // Obtener información de medicamentos controlados de la base de datos
  const medicationNames = medications.map(med => med.medication_name);
  
  const { data: dbMedications } = await supabaseAdmin
    .from('medication_database')
    .select('commercial_name, generic_name, is_controlled, controlled_substance_category')
    .or(medicationNames.map(name => 
      `commercial_name.ilike.%${name}%,generic_name.ilike.%${name}%`
    ).join(','));

  for (const medication of medications) {
    const dbMed = dbMedications?.find(db => 
      medication.medication_name.toLowerCase().includes(db.commercial_name.toLowerCase()) ||
      medication.medication_name.toLowerCase().includes(db.generic_name.toLowerCase())
    );
    
    if (dbMed && dbMed.is_controlled) {
      result.warnings.push({
        type: 'controlled-substance',
        message: `Medicamento controlado ${dbMed.controlled_substance_category ? 
          `(Categoría ${dbMed.controlled_substance_category})` : ''} - Requiere manejo especial`,
        medication: medication.medication_name
      });
    }
    
    // Verificar dosis potencialmente altas
    if (medication.dosage) {
      const dosage = medication.dosage.toLowerCase();
      if (dosage.includes('1000mg') || dosage.includes('1g')) {
        result.warnings.push({
          type: 'dosage-alert',
          message: 'Dosis alta detectada - Verificar que sea correcta',
          medication: medication.medication_name
        });
      }
    }
  }
}

/**
 * Verificar duplicidad terapéutica
 */
async function checkDuplicateTherapy(
  medications: any[], 
  result: InteractionResult
) {
  // Grupos terapéuticos comunes
  const therapeuticGroups: Record<string, string[]> = {
    'analgésicos': ['paracetamol', 'acetaminofen', 'tylenol'],
    'antiinflamatorios': ['ibuprofeno', 'naproxeno', 'diclofenaco', 'aspirina'],
    'antibióticos': ['amoxicilina', 'ampicilina', 'azitromicina', 'cephalexina']
  };

  for (const [group, meds] of Object.entries(therapeuticGroups)) {
    const matchingMedications = medications.filter(medication =>
      meds.some(med => medication.medication_name.toLowerCase().includes(med))
    );
    
    if (matchingMedications.length > 1) {
      result.warnings.push({
        type: 'duplicate-therapy',
        message: `Posible duplicidad terapéutica en ${group}`,
        medication: matchingMedications.map(med => med.medication_name).join(', ')
      });
    }
  }
}

/**
 * Verificar apropiación por edad
 */
async function checkAgeAppropriateness(
  medications: any[], 
  age: number, 
  result: InteractionResult
) {
  // Medicamentos potencialmente inapropiados por edad
  const ageRestrictions: Record<string, {
    min_age?: number;
    max_age?: number;
    warning: string;
  }> = {
    'aspirina': {
      min_age: 16,
      warning: 'Riesgo de síndrome de Reye en menores de 16 años'
    },
    'tramadol': {
      min_age: 12,
      warning: 'No recomendado en menores de 12 años'
    },
    'diazepam': {
      max_age: 65,
      warning: 'Uso precautorio en adultos mayores - riesgo de caídas'
    }
  };

  for (const medication of medications) {
    const medName = medication.medication_name.toLowerCase();
    
    for (const [restrictedMed, restriction] of Object.entries(ageRestrictions)) {
      if (medName.includes(restrictedMed)) {
        let shouldWarn = false;
        
        if (restriction.min_age && age < restriction.min_age) {
          shouldWarn = true;
        }
        
        if (restriction.max_age && age > restriction.max_age) {
          shouldWarn = true;
        }
        
        if (shouldWarn) {
          result.interactions.push({
            type: 'drug-age',
            severity: 'moderate',
            description: restriction.warning,
            recommendation: 'Evaluar alternativas terapéuticas apropiadas para la edad',
            medications_involved: [medication.medication_name],
            factor: `${age} años`
          });
        }
      }
    }
  }
}

/**
 * Calcular puntaje de seguridad (0-100)
 */
function calculateSafetyScore(result: InteractionResult): number {
  let score = 100;
  
  // Penalizar por interacciones según severidad
  for (const interaction of result.interactions) {
    switch (interaction.severity) {
      case 'critical':
        score -= 30;
        break;
      case 'high':
        score -= 20;
        break;
      case 'moderate':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  }
  
  // Penalizar por advertencias
  score -= result.warnings.length * 3;
  
  return Math.max(0, score);
}