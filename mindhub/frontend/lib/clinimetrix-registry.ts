// ClinimetrixPro Registry - Comprehensive scale definitions for the MindHub platform

export interface ClinimetrixRegistry {
  id: string;
  name: string;
  fullName: string;
  category: 'depression' | 'anxiety' | 'cognition' | 'autism' | 'psychosis' | 'personality' | 'eating' | 'sleep' | 'tics' | 'trauma' | 'suicide' | 'ocd';
  description: string;
  questions: number;
  timeEstimate: number; // in minutes
  targetAge: 'child' | 'adolescent' | 'adult' | 'elderly' | 'all';
  primaryUse: 'screening' | 'assessment' | 'monitoring' | 'outcome';
  domains: string[];
  scoringType: 'sum' | 'mean' | 'weighted' | 'categorical' | 'profile';
  cutoffPoints: { [key: string]: number };
  references: string[];
  isValidated: boolean;
  template: string;
  administration?: 'self' | 'interview' | 'both';
  languages?: string[];
  normData?: boolean;
  reliability?: {
    cronbachAlpha?: number;
    testRetest?: number;
  };
  validity?: {
    concurrent?: string[];
    predictive?: string[];
  };
}

// Complete registry of all 29+ ClinimetrixPro scales
export const CLINIMETRIX_REGISTRY: ClinimetrixRegistry[] = [
  // DEPRESSION SCALES
  {
    id: 'phq-9',
    name: 'PHQ-9',
    fullName: 'Patient Health Questionnaire-9',
    category: 'depression',
    description: 'Cuestionario de salud del paciente para detección y monitoreo de depresión',
    questions: 9,
    timeEstimate: 5,
    targetAge: 'adult',
    primaryUse: 'screening',
    domains: ['mood', 'anhedonia', 'sleep', 'energy', 'concentration', 'appetite', 'psychomotor', 'guilt', 'suicidality'],
    scoringType: 'sum',
    cutoffPoints: { 
      minimal: 0, 
      mild: 5, 
      moderate: 10, 
      moderatelySevere: 15, 
      severe: 20 
    },
    references: ['Kroenke et al., 2001', 'Löwe et al., 2004'],
    isValidated: true,
    template: 'phq-9',
    administration: 'self',
    languages: ['es', 'en'],
    normData: true,
    reliability: { cronbachAlpha: 0.89, testRetest: 0.84 }
  },
  {
    id: 'bdi-ii',
    name: 'BDI-II',
    fullName: 'Beck Depression Inventory-II',
    category: 'depression',
    description: 'Inventario de depresión de Beck, versión revisada para adultos',
    questions: 21,
    timeEstimate: 10,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['cognitive', 'affective', 'somatic', 'motivational'],
    scoringType: 'sum',
    cutoffPoints: { 
      minimal: 0, 
      mild: 14, 
      moderate: 20, 
      severe: 29 
    },
    references: ['Beck et al., 1996', 'Wang & Gorenstein, 2013'],
    isValidated: true,
    template: 'bdi-ii',
    administration: 'self',
    languages: ['es', 'en'],
    normData: true,
    reliability: { cronbachAlpha: 0.92, testRetest: 0.93 }
  },
  {
    id: 'bdi-13',
    name: 'BDI-13',
    fullName: 'Beck Depression Inventory-13 Items',
    category: 'depression',
    description: 'Versión corta del inventario de depresión de Beck',
    questions: 13,
    timeEstimate: 7,
    targetAge: 'adult',
    primaryUse: 'screening',
    domains: ['cognitive', 'affective', 'somatic'],
    scoringType: 'sum',
    cutoffPoints: { 
      minimal: 0, 
      mild: 4, 
      moderate: 7, 
      severe: 15 
    },
    references: ['Beck et al., 1974', 'Beck & Beck, 1972'],
    isValidated: true,
    template: 'bdi-13',
    administration: 'self'
  },
  {
    id: 'gds-5',
    name: 'GDS-5',
    fullName: 'Geriatric Depression Scale-5',
    category: 'depression',
    description: 'Escala de depresión geriátrica versión corta',
    questions: 5,
    timeEstimate: 3,
    targetAge: 'elderly',
    primaryUse: 'screening',
    domains: ['mood', 'satisfaction', 'hopelessness'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 0, 
      depression: 2 
    },
    references: ['Rinaldi et al., 2003', 'Hoyl et al., 1999'],
    isValidated: true,
    template: 'gds-5',
    administration: 'both'
  },
  {
    id: 'gds-15',
    name: 'GDS-15',
    fullName: 'Geriatric Depression Scale-15',
    category: 'depression',
    description: 'Escala de depresión geriátrica versión intermedia',
    questions: 15,
    timeEstimate: 8,
    targetAge: 'elderly',
    primaryUse: 'assessment',
    domains: ['mood', 'satisfaction', 'energy', 'social'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 0, 
      mild: 5, 
      severe: 10 
    },
    references: ['Sheikh & Yesavage, 1986', 'Martínez et al., 2002'],
    isValidated: true,
    template: 'gds-15',
    administration: 'both'
  },
  {
    id: 'hdrs-17',
    name: 'HDRS-17',
    fullName: 'Hamilton Depression Rating Scale-17',
    category: 'depression',
    description: 'Escala de evaluación de depresión de Hamilton',
    questions: 17,
    timeEstimate: 20,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['mood', 'guilt', 'suicide', 'insomnia', 'work', 'psychomotor', 'anxiety', 'somatic'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 0, 
      mild: 8, 
      moderate: 14, 
      severe: 19, 
      verySevere: 23 
    },
    references: ['Hamilton, 1960', 'Williams, 1988'],
    isValidated: true,
    template: 'hdrs-17',
    administration: 'interview'
  },
  {
    id: 'madrs',
    name: 'MADRS',
    fullName: 'Montgomery-Åsberg Depression Rating Scale',
    category: 'depression',
    description: 'Escala de depresión de Montgomery y Åsberg',
    questions: 10,
    timeEstimate: 15,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['apparent sadness', 'reported sadness', 'inner tension', 'reduced sleep', 'reduced appetite', 'concentration', 'lassitude', 'inability to feel', 'pessimistic thoughts', 'suicidal thoughts'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 0, 
      mild: 7, 
      moderate: 20, 
      severe: 35 
    },
    references: ['Montgomery & Åsberg, 1979', 'Carmody et al., 2006'],
    isValidated: true,
    template: 'madrs',
    administration: 'interview'
  },
  {
    id: 'rads-2',
    name: 'RADS-2',
    fullName: 'Reynolds Adolescent Depression Scale-2',
    category: 'depression',
    description: 'Escala de depresión para adolescentes de Reynolds',
    questions: 30,
    timeEstimate: 15,
    targetAge: 'adolescent',
    primaryUse: 'assessment',
    domains: ['dysphoric mood', 'anhedonia', 'negative self-evaluation', 'somatic complaints'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 60, 
      mild: 61, 
      moderate: 69, 
      severe: 77 
    },
    references: ['Reynolds, 2002', 'Hunter et al., 2014'],
    isValidated: true,
    template: 'rads-2',
    administration: 'self'
  },

  // ANXIETY SCALES
  {
    id: 'gad-7',
    name: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder-7',
    category: 'anxiety',
    description: 'Escala de trastorno de ansiedad generalizada',
    questions: 7,
    timeEstimate: 4,
    targetAge: 'adult',
    primaryUse: 'screening',
    domains: ['worry', 'anxiety', 'restlessness', 'fatigue', 'concentration', 'irritability', 'sleep'],
    scoringType: 'sum',
    cutoffPoints: { 
      minimal: 0, 
      mild: 5, 
      moderate: 10, 
      severe: 15 
    },
    references: ['Spitzer et al., 2006', 'García-Campayo et al., 2010'],
    isValidated: true,
    template: 'gad-7',
    administration: 'self',
    languages: ['es', 'en'],
    reliability: { cronbachAlpha: 0.92 }
  },
  {
    id: 'hars',
    name: 'HARS',
    fullName: 'Hamilton Anxiety Rating Scale',
    category: 'anxiety',
    description: 'Escala de evaluación de ansiedad de Hamilton',
    questions: 14,
    timeEstimate: 15,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['anxious mood', 'tension', 'fears', 'insomnia', 'intellectual', 'depressed mood', 'somatic muscular', 'somatic sensory', 'cardiovascular', 'respiratory', 'gastrointestinal', 'genitourinary', 'autonomic', 'behavior'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 0, 
      mild: 18, 
      moderate: 25, 
      severe: 30 
    },
    references: ['Hamilton, 1959', 'Maier et al., 1988'],
    isValidated: true,
    template: 'hars',
    administration: 'interview'
  },
  {
    id: 'stai',
    name: 'STAI',
    fullName: 'State-Trait Anxiety Inventory',
    category: 'anxiety',
    description: 'Inventario de ansiedad estado-rasgo',
    questions: 40,
    timeEstimate: 20,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['state anxiety', 'trait anxiety'],
    scoringType: 'profile',
    cutoffPoints: { 
      low: 20, 
      moderate: 40, 
      high: 60 
    },
    references: ['Spielberger et al., 1983', 'Guillén-Riquelme & Buela-Casal, 2011'],
    isValidated: true,
    template: 'stai',
    administration: 'self'
  },

  // AUTISM/ASD SCALES
  {
    id: 'aq-adolescent',
    name: 'AQ-Adolescent',
    fullName: 'Autism Quotient Adolescent Version',
    category: 'autism',
    description: 'Cuestionario de espectro autista para adolescentes',
    questions: 50,
    timeEstimate: 25,
    targetAge: 'adolescent',
    primaryUse: 'screening',
    domains: ['social skill', 'attention switching', 'attention to detail', 'communication', 'imagination'],
    scoringType: 'sum',
    cutoffPoints: { 
      typical: 0, 
      autistic: 32 
    },
    references: ['Baron-Cohen et al., 2006', 'Booth et al., 2013'],
    isValidated: true,
    template: 'aq-adolescent',
    administration: 'self'
  },
  {
    id: 'aq-child',
    name: 'AQ-Child',
    fullName: 'Autism Quotient Child Version',
    category: 'autism',
    description: 'Cuestionario de espectro autista para niños',
    questions: 50,
    timeEstimate: 20,
    targetAge: 'child',
    primaryUse: 'screening',
    domains: ['social skill', 'attention switching', 'attention to detail', 'communication', 'imagination'],
    scoringType: 'sum',
    cutoffPoints: { 
      typical: 0, 
      autistic: 76 
    },
    references: ['Auyeung et al., 2008', 'Russell et al., 2019'],
    isValidated: true,
    template: 'aq-child',
    administration: 'self'
  },

  // EATING DISORDERS
  {
    id: 'eat-26',
    name: 'EAT-26',
    fullName: 'Eating Attitudes Test-26',
    category: 'eating',
    description: 'Test de actitudes alimentarias',
    questions: 26,
    timeEstimate: 12,
    targetAge: 'adolescent',
    primaryUse: 'screening',
    domains: ['dieting', 'bulimia', 'oral control'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 0, 
      risk: 20 
    },
    references: ['Garner et al., 1982', 'Gandarillas et al., 2003'],
    isValidated: true,
    template: 'eat-26',
    administration: 'self'
  },

  // COGNITION SCALES
  {
    id: 'moca',
    name: 'MoCA',
    fullName: 'Montreal Cognitive Assessment',
    category: 'cognition',
    description: 'Evaluación cognitiva de Montreal',
    questions: 30,
    timeEstimate: 10,
    targetAge: 'adult',
    primaryUse: 'screening',
    domains: ['visuospatial', 'naming', 'memory', 'attention', 'language', 'abstraction', 'delayed recall', 'orientation'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 26, 
      mildImpairment: 18, 
      impaired: 0 
    },
    references: ['Nasreddine et al., 2005', 'Luis et al., 2009'],
    isValidated: true,
    template: 'moca',
    administration: 'interview'
  },

  // OCD SCALES
  {
    id: 'dy-bocs',
    name: 'DY-BOCS',
    fullName: 'Dimensional Yale-Brown Obsessive Compulsive Scale',
    category: 'ocd',
    description: 'Escala dimensional Yale-Brown para TOC',
    questions: 88,
    timeEstimate: 45,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['contamination', 'responsibility', 'unacceptable thoughts', 'symmetry', 'hoarding', 'superstitions'],
    scoringType: 'profile',
    cutoffPoints: { 
      subclinical: 0, 
      mild: 14, 
      moderate: 28, 
      severe: 42 
    },
    references: ['Rosario-Campos et al., 2006', 'Rodriguez-Salgado et al., 2006'],
    isValidated: true,
    template: 'dy-bocs',
    administration: 'interview'
  },
  {
    id: 'y-bocs',
    name: 'Y-BOCS',
    fullName: 'Yale-Brown Obsessive Compulsive Scale',
    category: 'ocd',
    description: 'Escala Yale-Brown para trastorno obsesivo compulsivo',
    questions: 10,
    timeEstimate: 30,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['obsessions time', 'obsessions interference', 'obsessions distress', 'obsessions resistance', 'obsessions control', 'compulsions time', 'compulsions interference', 'compulsions distress', 'compulsions resistance', 'compulsions control'],
    scoringType: 'sum',
    cutoffPoints: { 
      subclinical: 0, 
      mild: 8, 
      moderate: 16, 
      severe: 24, 
      extreme: 32 
    },
    references: ['Goodman et al., 1989', 'Frost et al., 1995'],
    isValidated: true,
    template: 'y-bocs',
    administration: 'interview'
  },

  // PSYCHOSIS SCALES
  {
    id: 'panss',
    name: 'PANSS',
    fullName: 'Positive and Negative Syndrome Scale',
    category: 'psychosis',
    description: 'Escala de síndrome positivo y negativo',
    questions: 30,
    timeEstimate: 45,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['positive symptoms', 'negative symptoms', 'general psychopathology'],
    scoringType: 'profile',
    cutoffPoints: { 
      normal: 30, 
      minimal: 58, 
      mild: 75, 
      moderate: 95, 
      severe: 116 
    },
    references: ['Kay et al., 1987', 'Peralta & Cuesta, 1994'],
    isValidated: true,
    template: 'panss',
    administration: 'interview'
  },

  // SLEEP SCALES
  {
    id: 'mos-sleep',
    name: 'MOS Sleep Scale',
    fullName: 'Medical Outcomes Study Sleep Scale',
    category: 'sleep',
    description: 'Escala de sueño del estudio de resultados médicos',
    questions: 12,
    timeEstimate: 8,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['sleep disturbance', 'snoring', 'shortness of breath', 'sleep adequacy', 'daytime somnolence', 'sleep quantity'],
    scoringType: 'profile',
    cutoffPoints: {},
    references: ['Hays et al., 2005', 'Rejas et al., 2007'],
    isValidated: true,
    template: 'mos-sleep',
    administration: 'self'
  },

  // TICS SCALES
  {
    id: 'ygtss',
    name: 'YGTSS',
    fullName: 'Yale Global Tic Severity Scale',
    category: 'tics',
    description: 'Escala global de severidad de tics de Yale',
    questions: 50,
    timeEstimate: 30,
    targetAge: 'child',
    primaryUse: 'assessment',
    domains: ['motor tics', 'vocal tics', 'impairment'],
    scoringType: 'sum',
    cutoffPoints: { 
      minimal: 0, 
      mild: 10, 
      moderate: 25, 
      severe: 50 
    },
    references: ['Leckman et al., 1989', 'Storch et al., 2005'],
    isValidated: true,
    template: 'ygtss',
    administration: 'interview'
  },

  // PERSONALITY DISORDERS
  {
    id: 'ipde-cie10',
    name: 'IPDE-CIE10',
    fullName: 'International Personality Disorder Examination CIE-10',
    category: 'personality',
    description: 'Examen internacional de trastornos de personalidad CIE-10',
    questions: 99,
    timeEstimate: 90,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['paranoid', 'schizoid', 'dissocial', 'emotionally unstable', 'histrionic', 'anankastic', 'anxious', 'dependent'],
    scoringType: 'categorical',
    cutoffPoints: {},
    references: ['Loranger et al., 1994', 'López-Ibor et al., 1996'],
    isValidated: true,
    template: 'ipde-cie10',
    administration: 'interview'
  },
  {
    id: 'ipde-dsmiv',
    name: 'IPDE-DSMIV',
    fullName: 'International Personality Disorder Examination DSM-IV',
    category: 'personality',
    description: 'Examen internacional de trastornos de personalidad DSM-IV',
    questions: 99,
    timeEstimate: 90,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['paranoid', 'schizoid', 'schizotypal', 'antisocial', 'borderline', 'histrionic', 'narcissistic', 'avoidant', 'dependent', 'obsessive-compulsive'],
    scoringType: 'categorical',
    cutoffPoints: {},
    references: ['Loranger et al., 1994', 'López-Ibor et al., 1996'],
    isValidated: true,
    template: 'ipde-dsmiv',
    administration: 'interview'
  },

  // TRAUMA SCALES
  {
    id: 'dts',
    name: 'DTS',
    fullName: 'Davidson Trauma Scale',
    category: 'trauma',
    description: 'Escala de trauma de Davidson',
    questions: 17,
    timeEstimate: 12,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['intrusion', 'avoidance', 'hyperarousal'],
    scoringType: 'sum',
    cutoffPoints: { 
      normal: 0, 
      ptsd: 40 
    },
    references: ['Davidson et al., 1997', 'Bobes et al., 2000'],
    isValidated: true,
    template: 'dts',
    administration: 'self'
  },

  // SUICIDE SCALES
  {
    id: 'sss-v',
    name: 'SSS-V',
    fullName: 'Scale for Suicide Ideation-Validated',
    category: 'suicide',
    description: 'Escala de ideación suicida validada',
    questions: 19,
    timeEstimate: 15,
    targetAge: 'adult',
    primaryUse: 'assessment',
    domains: ['wish to die', 'wish to live', 'reasons for living/dying', 'desire to make suicide attempt', 'passive attempt', 'duration', 'frequency', 'deterrents', 'reason for ideation', 'specificity', 'lethality', 'chance', 'controllability', 'deception', 'writing note', 'preparation', 'suicide note', 'final acts', 'concealment'],
    scoringType: 'sum',
    cutoffPoints: { 
      low: 0, 
      moderate: 6, 
      high: 19 
    },
    references: ['Beck et al., 1979', 'Miller et al., 1986'],
    isValidated: true,
    template: 'sss-v',
    administration: 'interview'
  }
];

// Helper functions
export const getScalesByCategory = (category: ClinimetrixRegistry['category']): ClinimetrixRegistry[] => {
  return CLINIMETRIX_REGISTRY.filter(scale => scale.category === category);
};

export const getScaleById = (id: string): ClinimetrixRegistry | undefined => {
  return CLINIMETRIX_REGISTRY.find(scale => scale.id === id);
};

export const searchScales = (query: string): ClinimetrixRegistry[] => {
  const searchTerm = query.toLowerCase();
  return CLINIMETRIX_REGISTRY.filter(scale =>
    scale.name.toLowerCase().includes(searchTerm) ||
    scale.fullName.toLowerCase().includes(searchTerm) ||
    scale.description.toLowerCase().includes(searchTerm) ||
    scale.domains.some(domain => domain.toLowerCase().includes(searchTerm))
  );
};

export const getScaleCategories = (): Array<{ id: string; label: string; count: number }> => {
  const categories = Array.from(new Set(CLINIMETRIX_REGISTRY.map(scale => scale.category)));
  return categories.map(category => ({
    id: category,
    label: category.charAt(0).toUpperCase() + category.slice(1),
    count: getScalesByCategory(category).length
  }));
};

// Export total count
export const TOTAL_SCALES_COUNT = CLINIMETRIX_REGISTRY.length;