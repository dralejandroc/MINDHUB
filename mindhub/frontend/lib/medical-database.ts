/**
 * Medical Database for MindHub - Expedix Module
 * Base de datos de medicamentos, códigos CIE-10 y rangos de signos vitales
 */

// Interfaces
export interface MedicationPresentation {
  form: string;
  concentration: string;
  substance: string;
}

export interface Medication {
  id: number;
  name: string;
  presentations: MedicationPresentation[];
  prescriptions: string[];
}

export interface CIE10Code {
  code: string;
  description: string;
}

export interface VitalSignRange {
  min: number;
  max: number;
  normal?: { min: number; max: number };
  unit: string;
}

export interface VitalSignsRanges {
  height: VitalSignRange;
  weight: VitalSignRange;
  bloodPressure: {
    systolic: VitalSignRange;
    diastolic: VitalSignRange;
    unit: string;
  };
  temperature: VitalSignRange;
  heartRate: VitalSignRange;
  respiratoryRate: VitalSignRange;
  oxygenSaturation: VitalSignRange;
}

export interface PrescriptionTemplate {
  name: string;
  medications: {
    name: string;
    presentation: string;
    substance: string;
    prescription: string;
  }[];
  additionalInstructions: string;
}

export interface VitalSigns {
  height?: string;
  weight?: string;
  bloodPressure: {
    systolic?: string;
    diastolic?: string;
  };
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
}

// Base de datos de medicamentos
export const MEDICATIONS_DATABASE: Medication[] = [
  {
    id: 1,
    name: "Sertralina",
    presentations: [
      {
        form: "Tableta",
        concentration: "50mg",
        substance: "Clorhidrato de sertralina"
      },
      {
        form: "Tableta",
        concentration: "100mg", 
        substance: "Clorhidrato de sertralina"
      }
    ],
    prescriptions: [
      "Tomar 1 tableta cada 24 horas en ayunas",
      "Tomar 1 tableta cada 24 horas con alimentos",
      "Tomar 1/2 tableta cada 24 horas por 7 días, luego 1 tableta cada 24 horas",
      "Tomar 1 tableta cada 24 horas por 8 semanas"
    ]
  },
  {
    id: 2,
    name: "Fluoxetina",
    presentations: [
      {
        form: "Cápsula",
        concentration: "20mg",
        substance: "Clorhidrato de fluoxetina"
      },
      {
        form: "Solución oral",
        concentration: "20mg/5ml",
        substance: "Clorhidrato de fluoxetina"
      }
    ],
    prescriptions: [
      "Tomar 1 cápsula cada 24 horas por la mañana",
      "Tomar 1 cápsula cada 24 horas con alimentos",
      "Tomar 1 cápsula cada 24 horas por 6 semanas",
      "Tomar 5ml cada 24 horas por la mañana"
    ]
  },
  {
    id: 3,
    name: "Escitalopram",
    presentations: [
      {
        form: "Tableta",
        concentration: "10mg",
        substance: "Oxalato de escitalopram"
      },
      {
        form: "Tableta",
        concentration: "20mg",
        substance: "Oxalato de escitalopram"
      }
    ],
    prescriptions: [
      "Tomar 1 tableta cada 24 horas por la mañana",
      "Tomar 1/2 tableta cada 24 horas por 7 días, luego 1 tableta",
      "Tomar 1 tableta cada 24 horas con alimentos por 4 semanas"
    ]
  },
  {
    id: 4,
    name: "Alprazolam",
    presentations: [
      {
        form: "Tableta",
        concentration: "0.25mg",
        substance: "Alprazolam"
      },
      {
        form: "Tableta",
        concentration: "0.5mg",
        substance: "Alprazolam"
      },
      {
        form: "Tableta",
        concentration: "1mg",
        substance: "Alprazolam"
      }
    ],
    prescriptions: [
      "Tomar 1 tableta cada 8 horas en caso de ansiedad",
      "Tomar 1/2 tableta cada 12 horas",
      "Tomar 1 tableta antes de dormir",
      "Tomar 1 tableta cada 6 horas si es necesario, máximo 3 al día"
    ]
  },
  {
    id: 5,
    name: "Lorazepam",
    presentations: [
      {
        form: "Tableta",
        concentration: "1mg",
        substance: "Lorazepam"
      },
      {
        form: "Tableta",
        concentration: "2mg",
        substance: "Lorazepam"
      }
    ],
    prescriptions: [
      "Tomar 1 tableta cada 12 horas",
      "Tomar 1/2 tableta antes de dormir",
      "Tomar 1 tableta cada 8 horas si es necesario"
    ]
  },
  {
    id: 6,
    name: "Clonazepam",
    presentations: [
      {
        form: "Tableta",
        concentration: "0.5mg",
        substance: "Clonazepam"
      },
      {
        form: "Tableta",
        concentration: "2mg",
        substance: "Clonazepam"
      }
    ],
    prescriptions: [
      "Tomar 1 tableta cada 12 horas",
      "Tomar 1/2 tableta antes de dormir",
      "Tomar 1 tableta cada 24 horas antes de dormir"
    ]
  },
  {
    id: 7,
    name: "Quetiapina",
    presentations: [
      {
        form: "Tableta",
        concentration: "25mg",
        substance: "Fumarato de quetiapina"
      },
      {
        form: "Tableta",
        concentration: "100mg",
        substance: "Fumarato de quetiapina"
      },
      {
        form: "Tableta",
        concentration: "200mg",
        substance: "Fumarato de quetiapina"
      }
    ],
    prescriptions: [
      "Tomar 1 tableta antes de dormir",
      "Tomar 1/2 tableta cada 12 horas",
      "Tomar 1 tableta cada 24 horas antes de dormir"
    ]
  },
  {
    id: 8,
    name: "Risperidona",
    presentations: [
      {
        form: "Tableta",
        concentration: "1mg",
        substance: "Risperidona"
      },
      {
        form: "Tableta",
        concentration: "2mg",
        substance: "Risperidona"
      },
      {
        form: "Solución oral",
        concentration: "1mg/ml",
        substance: "Risperidona"
      }
    ],
    prescriptions: [
      "Tomar 1 tableta cada 12 horas",
      "Tomar 1/2 tableta cada 24 horas",
      "Tomar 1ml cada 12 horas"
    ]
  },
  {
    id: 9,
    name: "Bupropión",
    presentations: [
      {
        form: "Tableta",
        concentration: "150mg",
        substance: "Clorhidrato de bupropión"
      },
      {
        form: "Tableta de liberación prolongada",
        concentration: "300mg",
        substance: "Clorhidrato de bupropión"
      }
    ],
    prescriptions: [
      "Tomar 1 tableta cada 24 horas por la mañana",
      "Tomar 1 tableta cada 12 horas con alimentos",
      "Tomar 1 tableta cada 24 horas por 6 semanas"
    ]
  },
  {
    id: 10,
    name: "Venlafaxina",
    presentations: [
      {
        form: "Cápsula de liberación prolongada",
        concentration: "75mg",
        substance: "Clorhidrato de venlafaxina"
      },
      {
        form: "Cápsula de liberación prolongada",
        concentration: "150mg",
        substance: "Clorhidrato de venlafaxina"
      }
    ],
    prescriptions: [
      "Tomar 1 cápsula cada 24 horas con alimentos",
      "Tomar 1 cápsula cada 24 horas por la mañana",
      "Tomar 1/2 cápsula cada 24 horas por 7 días, luego 1 cápsula"
    ]
  }
];

// Códigos CIE-10 para diagnósticos psiquiátricos
export const CIE10_CODES: CIE10Code[] = [
  { code: "F32.0", description: "Episodio depresivo leve" },
  { code: "F32.1", description: "Episodio depresivo moderado" },
  { code: "F32.2", description: "Episodio depresivo grave sin síntomas psicóticos" },
  { code: "F32.3", description: "Episodio depresivo grave con síntomas psicóticos" },
  { code: "F33.0", description: "Trastorno depresivo recurrente, episodio actual leve" },
  { code: "F33.1", description: "Trastorno depresivo recurrente, episodio actual moderado" },
  { code: "F33.2", description: "Trastorno depresivo recurrente, episodio actual grave sin síntomas psicóticos" },
  { code: "F41.0", description: "Trastorno de pánico (ansiedad paroxística episódica)" },
  { code: "F41.1", description: "Trastorno de ansiedad generalizada" },
  { code: "F41.2", description: "Trastorno mixto ansioso-depresivo" },
  { code: "F40.0", description: "Agorafobia" },
  { code: "F40.1", description: "Fobias sociales" },
  { code: "F40.2", description: "Fobias específicas (aisladas)" },
  { code: "F43.0", description: "Reacción a estrés agudo" },
  { code: "F43.1", description: "Trastorno de estrés postraumático" },
  { code: "F43.2", description: "Trastornos de adaptación" },
  { code: "F42.0", description: "Trastorno obsesivo-compulsivo con predominio de pensamientos obsesivos" },
  { code: "F42.1", description: "Trastorno obsesivo-compulsivo con predominio de actos compulsivos" },
  { code: "F42.2", description: "Trastorno obsesivo-compulsivo mixto" },
  { code: "F31.0", description: "Trastorno bipolar, episodio actual hipomaníaco" },
  { code: "F31.1", description: "Trastorno bipolar, episodio actual maníaco sin síntomas psicóticos" },
  { code: "F31.2", description: "Trastorno bipolar, episodio actual maníaco con síntomas psicóticos" },
  { code: "F25.0", description: "Trastorno esquizoafectivo de tipo maníaco" },
  { code: "F25.1", description: "Trastorno esquizoafectivo de tipo depresivo" },
  { code: "F20.0", description: "Esquizofrenia paranoide" },
  { code: "F20.1", description: "Esquizofrenia hebefrénica" },
  { code: "F60.3", description: "Trastorno de inestabilidad emocional de la personalidad" },
  { code: "F84.0", description: "Autismo infantil" },
  { code: "F84.5", description: "Síndrome de Asperger" },
  { code: "F90.0", description: "Trastorno de la actividad y de la atención" },
  { code: "F90.1", description: "Trastorno hipercinético disocial" },
  { code: "F50.0", description: "Anorexia nerviosa" },
  { code: "F50.2", description: "Bulimia nerviosa" },
  { code: "F10.1", description: "Trastornos mentales y del comportamiento debidos al uso de alcohol, uso perjudicial" },
  { code: "F10.2", description: "Trastornos mentales y del comportamiento debidos al uso de alcohol, síndrome de dependencia" }
];

// Rangos normales de signos vitales
export const VITAL_SIGNS_RANGES: VitalSignsRanges = {
  height: {
    min: 0.50,
    max: 2.50,
    unit: "m"
  },
  weight: {
    min: 1,
    max: 300,
    unit: "kg"
  },
  bloodPressure: {
    systolic: {
      min: 60,
      max: 200,
      normal: { min: 90, max: 140 },
      unit: "mmHg"
    },
    diastolic: {
      min: 40,
      max: 120,
      normal: { min: 60, max: 90 },
      unit: "mmHg"
    },
    unit: "mmHg"
  },
  temperature: {
    min: 32.0,
    max: 42.0,
    normal: { min: 36.0, max: 37.5 },
    unit: "°C"
  },
  heartRate: {
    min: 30,
    max: 200,
    normal: { min: 60, max: 100 },
    unit: "lpm"
  },
  respiratoryRate: {
    min: 8,
    max: 40,
    normal: { min: 12, max: 20 },
    unit: "rpm"
  },
  oxygenSaturation: {
    min: 70,
    max: 100,
    normal: { min: 95, max: 100 },
    unit: "%"
  }
};

// Plantillas de recetas comunes
export const PRESCRIPTION_TEMPLATES: Record<string, PrescriptionTemplate> = {
  depression: {
    name: "Tratamiento de Depresión Leve-Moderada",
    medications: [
      {
        name: "Sertralina",
        presentation: "Tableta 50mg",
        substance: "Clorhidrato de sertralina",
        prescription: "Tomar 1 tableta cada 24 horas en ayunas por 8 semanas"
      }
    ],
    additionalInstructions: "Evitar consumo de alcohol. Control en 2 semanas para evaluar tolerancia y efectividad."
  },
  anxiety: {
    name: "Tratamiento de Ansiedad Generalizada",
    medications: [
      {
        name: "Escitalopram",
        presentation: "Tableta 10mg",
        substance: "Oxalato de escitalopram",
        prescription: "Tomar 1 tableta cada 24 horas por la mañana"
      },
      {
        name: "Alprazolam",
        presentation: "Tableta 0.25mg",
        substance: "Alprazolam",
        prescription: "Tomar 1 tableta cada 8 horas solo en caso de crisis de ansiedad, máximo 3 al día"
      }
    ],
    additionalInstructions: "Técnicas de respiración y relajación. Alprazolam solo para crisis, no uso continuo."
  }
};

// Función para validar signos vitales
export function validateVitalSigns(vitals: VitalSigns): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const results = {
    isValid: true,
    warnings: [] as string[],
    errors: [] as string[]
  };
  
  // Validar presión arterial
  if (vitals?.bloodPressure?.systolic && vitals?.bloodPressure?.diastolic) {
    const systolic = parseInt(vitals?.bloodPressure?.systolic);
    const diastolic = parseInt(vitals?.bloodPressure?.diastolic);
    
    if (systolic < VITAL_SIGNS_RANGES.bloodPressure?.systolic.normal!.min || 
        systolic > VITAL_SIGNS_RANGES.bloodPressure?.systolic.normal!.max) {
      results.warnings.push(`Presión sistólica ${systolic} fuera del rango normal (${VITAL_SIGNS_RANGES.bloodPressure?.systolic.normal!.min}-${VITAL_SIGNS_RANGES.bloodPressure?.systolic.normal!.max})`);
    }
    
    if (diastolic < VITAL_SIGNS_RANGES.bloodPressure?.diastolic.normal!.min || 
        diastolic > VITAL_SIGNS_RANGES.bloodPressure?.diastolic.normal!.max) {
      results.warnings.push(`Presión diastólica ${diastolic} fuera del rango normal (${VITAL_SIGNS_RANGES.bloodPressure?.diastolic.normal!.min}-${VITAL_SIGNS_RANGES.bloodPressure?.diastolic.normal!.max})`);
    }
  }
  
  // Validar temperatura
  if (vitals?.temperature) {
    const temp = parseFloat(vitals.temperature);
    if (temp < VITAL_SIGNS_RANGES.temperature.normal!.min || 
        temp > VITAL_SIGNS_RANGES.temperature.normal!.max) {
      results.warnings.push(`Temperatura ${temp}°C fuera del rango normal (${VITAL_SIGNS_RANGES.temperature.normal!.min}-${VITAL_SIGNS_RANGES.temperature.normal!.max}°C)`);
    }
  }
  
  // Validar frecuencia cardíaca
  if (vitals?.heartRate) {
    const hr = parseInt(vitals.heartRate);
    if (hr < VITAL_SIGNS_RANGES.heartRate.normal!.min || 
        hr > VITAL_SIGNS_RANGES.heartRate.normal!.max) {
      results.warnings.push(`Frecuencia cardíaca ${hr} lpm fuera del rango normal (${VITAL_SIGNS_RANGES.heartRate.normal!.min}-${VITAL_SIGNS_RANGES.heartRate.normal!.max} lpm)`);
    }
  }
  
  // Validar saturación de oxígeno
  if (vitals.oxygenSaturation) {
    const sat = parseInt(vitals.oxygenSaturation);
    if (sat < VITAL_SIGNS_RANGES.oxygenSaturation.normal!.min) {
      results.errors.push(`Saturación de oxígeno ${sat}% por debajo del rango normal (>${VITAL_SIGNS_RANGES.oxygenSaturation.normal!.min}%)`);
      results.isValid = false;
    }
  }
  
  return results;
}

// Función para calcular IMC
export function calculateBMI(weight: number | string, height: number | string): {
  value: number;
  category: string;
} | null {
  const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
  const heightNum = typeof height === 'string' ? parseFloat(height) : height;
  
  if (!weightNum || !heightNum) return null;
  
  const bmi = weightNum / (heightNum * heightNum);
  let category = '';
  
  if (bmi < 18.5) category = 'Bajo peso';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Sobrepeso';
  else category = 'Obesidad';
  
  return {
    value: Math.round(bmi * 100) / 100,
    category
  };
}

// Función para generar número de folio de receta
export function generatePrescriptionFolio(): string {
  const prefix = 'RX';
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${timestamp.slice(-8)}${random}`;
}

// Función para buscar medicamentos
export function searchMedications(query: string): Medication[] {
  if (!query.trim()) return MEDICATIONS_DATABASE;
  
  const searchTerm = query.toLowerCase();
  return MEDICATIONS_DATABASE.filter(med =>
    med.name.toLowerCase().includes(searchTerm) ||
    med.presentations.some(pres => 
      pres.substance.toLowerCase().includes(searchTerm)
    )
  );
}

// Función para buscar códigos CIE-10
export function searchCIE10Codes(query: string): CIE10Code[] {
  if (!query.trim()) return CIE10_CODES;
  
  const searchTerm = query.toLowerCase();
  return CIE10_CODES.filter(code =>
    code.code.toLowerCase().includes(searchTerm) ||
    code.description.toLowerCase().includes(searchTerm)
  );
}