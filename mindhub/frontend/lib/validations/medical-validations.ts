/**
 * VALIDACIONES MÉDICAS CRÍTICAS - Zod Schemas
 * Validaciones para campos críticos de diagnósticos, medicaciones y prescripciones
 */

import { z } from 'zod';

// ========================
// VALIDACIONES DE MEDICAMENTOS
// ========================

export const MedicationSchema = z.object({
  id: z.number().optional(),
  name: z.string()
    .min(2, 'El nombre del medicamento debe tener al menos 2 caracteres')
    .max(200, 'El nombre del medicamento no puede exceder 200 caracteres')
    .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-\(\)\/\d\.]+$/, 'Nombre de medicamento contiene caracteres inválidos'),
  
  substance: z.string()
    .min(2, 'La sustancia activa debe tener al menos 2 caracteres')
    .max(200, 'La sustancia activa no puede exceder 200 caracteres'),
  
  presentation: z.string()
    .min(2, 'La presentación debe especificarse')
    .max(100, 'La presentación no puede exceder 100 caracteres'),
  
  prescription: z.string()
    .min(5, 'La prescripción debe ser específica (mínimo 5 caracteres)')
    .max(500, 'La prescripción no puede exceder 500 caracteres')
    .refine(
      (prescription) => {
        // Validar que contenga información básica de dosificación
        const dosagePatterns = [
          /\d+\s*(mg|g|ml|tabletas?|cápsulas?|gotas?|cucharadas?)/i,
          /cada\s+\d+\s*(horas?|hrs?|días?|día)/i,
          /por\s+\d+\s*(días?|día|semanas?|meses?)/i
        ];
        return dosagePatterns.some(pattern => pattern.test(prescription));
      },
      'La prescripción debe incluir dosis, frecuencia y duración (ej: "10mg cada 8 horas por 7 días")'
    )
});

export const MedicationListSchema = z.array(MedicationSchema)
  .min(0)
  .max(20, 'No se pueden prescribir más de 20 medicamentos por consulta');

// ========================
// VALIDACIONES DE DIAGNÓSTICOS
// ========================

export const DiagnosisSchema = z.object({
  primary: z.string()
    .min(5, 'El diagnóstico principal debe tener al menos 5 caracteres')
    .max(500, 'El diagnóstico principal no puede exceder 500 caracteres')
    .refine(
      (diagnosis) => {
        // Validar que no sean solo síntomas generales
        const invalidTerms = ['dolor', 'malestar', 'molestia', 'problema', 'issue'];
        return !invalidTerms.some(term => 
          diagnosis.toLowerCase().trim() === term || 
          diagnosis.toLowerCase().startsWith(`${term} `)
        );
      },
      'El diagnóstico debe ser específico, no solo síntomas generales'
    ),

  secondary: z.array(z.string().min(3).max(300)).optional(),
  
  severity: z.enum(['leve', 'moderado', 'severo', 'crítico'], {
    errorMap: () => ({ message: 'La severidad debe ser: leve, moderado, severo o crítico' })
  }).optional(),
  
  confidence: z.number()
    .min(0, 'La confianza no puede ser negativa')
    .max(100, 'La confianza no puede ser mayor a 100%')
    .optional(),
  
  differential: z.array(z.string().min(3).max(200)).optional(),
  
  cie10_code: z.string()
    .regex(/^[A-Z]\d{2}(\.\d{1,2})?$/, 'Código CIE-10 inválido (formato: A00 o A00.0)')
    .optional()
});

// ========================
// VALIDACIONES DE SIGNOS VITALES
// ========================

export const VitalSignsSchema = z.object({
  height: z.string()
    .optional()
    .refine(
      (height) => {
        if (!height) return true;
        const numHeight = parseFloat(height);
        return numHeight >= 50 && numHeight <= 250;
      },
      'La altura debe estar entre 50-250 cm'
    ),

  weight: z.string()
    .optional()
    .refine(
      (weight) => {
        if (!weight) return true;
        const numWeight = parseFloat(weight);
        return numWeight >= 2 && numWeight <= 300;
      },
      'El peso debe estar entre 2-300 kg'
    ),

  bloodPressure: z.object({
    systolic: z.string()
      .optional()
      .refine(
        (sys) => {
          if (!sys) return true;
          const numSys = parseInt(sys);
          return numSys >= 70 && numSys <= 250;
        },
        'Presión sistólica debe estar entre 70-250 mmHg'
      ),
    
    diastolic: z.string()
      .optional()
      .refine(
        (dia) => {
          if (!dia) return true;
          const numDia = parseInt(dia);
          return numDia >= 40 && numDia <= 150;
        },
        'Presión diastólica debe estar entre 40-150 mmHg'
      )
  }).refine(
    (bp) => {
      if (!bp.systolic || !bp.diastolic) return true;
      const sys = parseInt(bp.systolic);
      const dia = parseInt(bp.diastolic);
      return sys > dia;
    },
    'La presión sistólica debe ser mayor que la diastólica'
  ),

  temperature: z.string()
    .optional()
    .refine(
      (temp) => {
        if (!temp) return true;
        const numTemp = parseFloat(temp);
        return numTemp >= 32 && numTemp <= 45;
      },
      'La temperatura debe estar entre 32-45°C'
    ),

  heartRate: z.string()
    .optional()
    .refine(
      (hr) => {
        if (!hr) return true;
        const numHr = parseInt(hr);
        return numHr >= 30 && numHr <= 220;
      },
      'Frecuencia cardíaca debe estar entre 30-220 bpm'
    ),

  respiratoryRate: z.string()
    .optional()
    .refine(
      (rr) => {
        if (!rr) return true;
        const numRr = parseInt(rr);
        return numRr >= 8 && numRr <= 60;
      },
      'Frecuencia respiratoria debe estar entre 8-60 rpm'
    ),

  oxygenSaturation: z.string()
    .optional()
    .refine(
      (sat) => {
        if (!sat) return true;
        const numSat = parseInt(sat);
        return numSat >= 70 && numSat <= 100;
      },
      'Saturación de oxígeno debe estar entre 70-100%'
    )
});

// ========================
// VALIDACIONES DE EXAMEN MENTAL
// ========================

export const MentalExamSchema = z.object({
  descripcionInspeccion: z.string()
    .min(10, 'La descripción de inspección debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),

  apariencia: z.enum([
    'cuidada', 'descuidada', 'extravagante', 'normal', 'apropiada', 'inapropiada'
  ], {
    errorMap: () => ({ message: 'Seleccione una apariencia válida' })
  }),

  actitud: z.enum([
    'colaboradora', 'hostil', 'evasiva', 'suspicaz', 'seductora', 'defensiva', 'cooperativa'
  ], {
    errorMap: () => ({ message: 'Seleccione una actitud válida' })
  }),

  conciencia: z.enum([
    'alerta', 'somnolencia', 'obnubilacion', 'sopor', 'coma', 'confuso'
  ], {
    errorMap: () => ({ message: 'Seleccione un nivel de conciencia válido' })
  }),

  orientacion: z.enum([
    'orientado-tiempo-espacio-persona',
    'desorientado-tiempo',
    'desorientado-espacio', 
    'desorientado-persona',
    'desorientado-total'
  ], {
    errorMap: () => ({ message: 'Seleccione un estado de orientación válido' })
  }),

  atencion: z.enum([
    'normal', 'hipoprosexia', 'aprosexia', 'hiperprosexia', 'distractibilidad'
  ], {
    errorMap: () => ({ message: 'Seleccione un estado de atención válido' })
  }),

  lenguaje: z.enum([
    'normal', 'taquilalia', 'bradilalia', 'mutismo', 'ecolalia', 'neologismos'
  ], {
    errorMap: () => ({ message: 'Seleccione un estado de lenguaje válido' })
  }),

  afecto: z.enum([
    'eutimico', 'depresivo', 'eufórico', 'irritable', 'lábil', 'aplanado', 'angustiado'
  ], {
    errorMap: () => ({ message: 'Seleccione un estado afectivo válido' })
  }),

  sensopercepcion: z.string()
    .max(500, 'La descripción de sensopercepción no puede exceder 500 caracteres'),

  memoria: z.enum([
    'normal', 'hipomnesia', 'amnesia', 'hipermnesia', 'paramnesia'
  ], {
    errorMap: () => ({ message: 'Seleccione un estado de memoria válido' })
  }),

  pensamientoPrincipal: z.string()
    .max(1000, 'El contenido del pensamiento no puede exceder 1000 caracteres'),

  pensamientoDetalles: z.string()
    .max(1000, 'Los detalles del pensamiento no pueden exceder 1000 caracteres')
});

// ========================
// VALIDACIÓN COMPLETA DE CONSULTA
// ========================

export const ConsultationValidationSchema = z.object({
  noteType: z.string().min(1, 'El tipo de consulta es obligatorio'),
  
  date: z.string()
    .min(1, 'La fecha es obligatoria')
    .refine(
      (date) => {
        const consultationDate = new Date(date);
        const now = new Date();
        const maxFutureDate = new Date();
        maxFutureDate.setDate(maxFutureDate.getDate() + 30);
        
        return consultationDate <= maxFutureDate;
      },
      'La fecha de consulta no puede ser más de 30 días en el futuro'
    ),

  patientOffice: z.string().max(200),
  
  currentCondition: z.string()
    .min(10, 'La condición actual debe tener al menos 10 caracteres')
    .max(2000, 'La condición actual no puede exceder 2000 caracteres'),

  vitalSigns: VitalSignsSchema,
  
  physicalExamination: z.string()
    .max(2000, 'El examen físico no puede exceder 2000 caracteres'),
  
  labResults: z.string()
    .max(2000, 'Los resultados de laboratorio no pueden exceder 2000 caracteres'),
  
  diagnosis: DiagnosisSchema.or(z.string().min(5, 'El diagnóstico debe tener al menos 5 caracteres')),
  
  temporality: z.enum(['acute', 'chronic', 'subacute'], {
    errorMap: () => ({ message: 'La temporalidad debe ser: aguda, crónica o subaguda' })
  }),
  
  medications: MedicationListSchema,
  
  additionalInstructions: z.string()
    .max(2000, 'Las instrucciones adicionales no pueden exceder 2000 caracteres'),
  
  labOrders: z.string()
    .max(1000, 'Las órdenes de laboratorio no pueden exceder 1000 caracteres'),
  
  nextAppointment: z.object({
    time: z.string(),
    date: z.string()
  }),

  mentalExam: MentalExamSchema.optional(),
  
  specialtyFields: z.record(z.any()).optional()
});

// ========================
// VALIDACIONES DE INTERACCIONES MEDICAMENTOSAS
// ========================

export interface DrugInteraction {
  medication1: string;
  medication2: string;
  severity: 'leve' | 'moderada' | 'severa' | 'contraindicada';
  description: string;
  recommendation: string;
}

// Base de datos simple de interacciones críticas
const CRITICAL_INTERACTIONS: DrugInteraction[] = [
  {
    medication1: 'warfarina',
    medication2: 'aspirina',
    severity: 'severa',
    description: 'Riesgo aumentado de sangrado',
    recommendation: 'Monitorear INR más frecuentemente. Considerar alternativas.'
  },
  {
    medication1: 'digoxina',
    medication2: 'furosemida',
    severity: 'moderada', 
    description: 'Riesgo de toxicidad digitálica por hipokalemia',
    recommendation: 'Monitorear potasio sérico y niveles de digoxina.'
  },
  {
    medication1: 'inhibidores ace',
    medication2: 'espironolactona',
    severity: 'moderada',
    description: 'Riesgo de hiperkalemia',
    recommendation: 'Monitorear potasio sérico regularmente.'
  }
];

export function validateDrugInteractions(medications: { name: string; substance: string }[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i];
      const med2 = medications[j];
      
      const interaction = CRITICAL_INTERACTIONS.find(inter => 
        (inter.medication1.toLowerCase() === med1.name.toLowerCase() && 
         inter.medication2.toLowerCase() === med2.name.toLowerCase()) ||
        (inter.medication1.toLowerCase() === med2.name.toLowerCase() && 
         inter.medication2.toLowerCase() === med1.name.toLowerCase()) ||
        (inter.medication1.toLowerCase() === med1.substance.toLowerCase() && 
         inter.medication2.toLowerCase() === med2.substance.toLowerCase()) ||
        (inter.medication1.toLowerCase() === med2.substance.toLowerCase() && 
         inter.medication2.toLowerCase() === med1.substance.toLowerCase())
      );
      
      if (interaction) {
        interactions.push({
          ...interaction,
          medication1: med1.name,
          medication2: med2.name
        });
      }
    }
  }
  
  return interactions;
}

// ========================
// VALIDACIONES DE ALERGIAS
// ========================

export const AllergySchema = z.object({
  allergen: z.string()
    .min(2, 'El alérgeno debe tener al menos 2 caracteres')
    .max(100, 'El alérgeno no puede exceder 100 caracteres'),
  
  reaction: z.string()
    .min(3, 'La reacción debe especificarse')
    .max(300, 'La reacción no puede exceder 300 caracteres'),
  
  severity: z.enum(['leve', 'moderada', 'severa', 'anafilaxia'], {
    errorMap: () => ({ message: 'La severidad debe ser: leve, moderada, severa o anafilaxia' })
  }),
  
  verified: z.boolean().default(false),
  
  notes: z.string().max(500).optional()
});

export function checkMedicationAllergies(
  medications: { name: string; substance: string }[], 
  allergies: { allergen: string; severity: string }[]
): Array<{ medication: string; allergy: string; severity: string }> {
  const conflicts: Array<{ medication: string; allergy: string; severity: string }> = [];
  
  medications.forEach(med => {
    allergies.forEach(allergy => {
      if (
        med.name.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
        med.substance.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
        allergy.allergen.toLowerCase().includes(med.substance.toLowerCase())
      ) {
        conflicts.push({
          medication: med.name,
          allergy: allergy.allergen,
          severity: allergy.severity
        });
      }
    });
  });
  
  return conflicts;
}

// ========================
// UTILIDADES DE VALIDACIÓN
// ========================

export function validateConsultationSafety(consultationData: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  drugInteractions: DrugInteraction[];
  allergyConflicts: Array<{ medication: string; allergy: string; severity: string }>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Validar esquema principal
    ConsultationValidationSchema.parse(consultationData);
  } catch (zodError: any) {
    zodError.errors.forEach((error: any) => {
      errors.push(`${error.path.join('.')}: ${error.message}`);
    });
  }
  
  // Validar interacciones medicamentosas
  const drugInteractions = validateDrugInteractions(consultationData.medications || []);
  drugInteractions.forEach(interaction => {
    if (interaction.severity === 'severa' || interaction.severity === 'contraindicada') {
      errors.push(`Interacción ${interaction.severity}: ${interaction.medication1} + ${interaction.medication2}`);
    } else {
      warnings.push(`Interacción ${interaction.severity}: ${interaction.medication1} + ${interaction.medication2} - ${interaction.recommendation}`);
    }
  });
  
  // Validar conflictos con alergias (si están disponibles)
  const allergyConflicts = consultationData.patientAllergies 
    ? checkMedicationAllergies(consultationData.medications || [], consultationData.patientAllergies)
    : [];
  
  allergyConflicts.forEach(conflict => {
    if (conflict.severity === 'severa' || conflict.severity === 'anafilaxia') {
      errors.push(`¡PELIGRO! Paciente alérgico a ${conflict.allergy} - prescrito ${conflict.medication}`);
    } else {
      warnings.push(`Precaución: Paciente con alergia ${conflict.severity} a ${conflict.allergy} - prescrito ${conflict.medication}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    drugInteractions,
    allergyConflicts
  };
}

export default {
  MedicationSchema,
  DiagnosisSchema,
  VitalSignsSchema,
  MentalExamSchema,
  ConsultationValidationSchema,
  AllergySchema,
  validateDrugInteractions,
  checkMedicationAllergies,
  validateConsultationSafety
};