/**
 * Seed data: Modos de administración para escalas clínicas
 * 
 * Este archivo define qué escalas pueden ser:
 * - 'clinician_administered': Solo heteroadministradas (requieren profesional)
 * - 'self_administered': Solo autoadministradas (paciente responde solo)
 * - 'both': Flexibles (pueden ser administradas de ambas formas)
 */

const scaleAdministrationModes = [
  // =============================================================================
  // ESCALAS SOLO HETEROADMINISTRADAS (Requieren profesional)
  // =============================================================================
  {
    abbreviation: 'MMSE',
    administration_mode: 'clinician_administered',
    reason: 'Requiere observación clínica y evaluación directa del profesional'
  },
  {
    abbreviation: 'ADAS-Cog',
    administration_mode: 'clinician_administered',
    reason: 'Requiere administración estandarizada por profesional entrenado'
  },
  {
    abbreviation: 'SCID-5',
    administration_mode: 'clinician_administered',
    reason: 'Entrevista clínica estructurada que requiere profesional'
  },
  {
    abbreviation: 'WAIS-IV',
    administration_mode: 'clinician_administered',
    reason: 'Test de inteligencia que requiere administración profesional'
  },

  // =============================================================================
  // ESCALAS SOLO AUTOADMINISTRADAS (Paciente responde solo)
  // =============================================================================
  {
    abbreviation: 'SF-36',
    administration_mode: 'self_administered',
    reason: 'Diseñada específicamente para autoadministración'
  },
  {
    abbreviation: 'EQ-5D',
    administration_mode: 'self_administered',
    reason: 'Cuestionario de calidad de vida para autoadministración'
  },

  // =============================================================================
  // ESCALAS FLEXIBLES (Pueden ser ambas formas)
  // =============================================================================
  
  // Escalas de Depresión
  {
    abbreviation: 'GDS-15',
    administration_mode: 'both',
    reason: 'Puede ser administrada por clínico o autoaplicada por paciente'
  },
  {
    abbreviation: 'GDS-30',
    administration_mode: 'both',
    reason: 'Versión extendida, flexible en su administración'
  },
  {
    abbreviation: 'PHQ-9',
    administration_mode: 'both',
    reason: 'Ampliamente usada tanto en modalidad clínica como autoaplicada'
  },
  {
    abbreviation: 'BDI-II',
    administration_mode: 'both',
    reason: 'Inventario de Beck, flexible en administración'
  },
  {
    abbreviation: 'MADRS',
    administration_mode: 'both',
    reason: 'Puede ser administrada por clínico o como autoinforme'
  },

  // Escalas de Ansiedad
  {
    abbreviation: 'GAD-7',
    administration_mode: 'both',
    reason: 'Escala versátil para ansiedad generalizada'
  },
  {
    abbreviation: 'BAI',
    administration_mode: 'both',
    reason: 'Inventario de ansiedad de Beck, administración flexible'
  },
  {
    abbreviation: 'HAM-A',
    administration_mode: 'both',
    reason: 'Hamilton para ansiedad, modalidad flexible'
  },

  // Escalas de Estrés y Calidad de Vida
  {
    abbreviation: 'PSS',
    administration_mode: 'both',
    reason: 'Escala de estrés percibido, administración flexible'
  },
  {
    abbreviation: 'DASS-21',
    administration_mode: 'both',
    reason: 'Depresión, ansiedad y estrés, modalidad flexible'
  },

  // Escalas de Trastornos Específicos
  {
    abbreviation: 'Y-BOCS',
    administration_mode: 'both',
    reason: 'Yale-Brown para TOC, puede ser hetero o autoaplicada'
  },
  {
    abbreviation: 'AUDIT',
    administration_mode: 'both',
    reason: 'Screening de alcohol, flexible en administración'
  }
];

module.exports = scaleAdministrationModes;

/**
 * Instrucciones de uso:
 * 
 * 1. En las seeds principales (seedClinimetriales.js), usar este archivo para actualizar
 *    el campo administration_mode de cada escala:
 * 
 *    const administrationModes = require('./scales-administration-modes');
 *    
 *    // Al crear cada escala:
 *    const modeConfig = administrationModes.find(m => m.abbreviation === scaleAbbreviation);
 *    const administrationMode = modeConfig?.administration_mode || 'clinician_administered';
 * 
 * 2. En la base de datos, asegurarse de que el campo administration_mode acepta estos valores:
 *    - 'clinician_administered' 
 *    - 'self_administered'
 *    - 'both'
 * 
 * 3. En el frontend, el componente UniversalCardBasedAssessment ya maneja la lógica:
 *    - Si administration_mode === 'both': Muestra selector de modo
 *    - Si administration_mode === 'self_administered': Siempre muestra Card00
 *    - Si administration_mode === 'clinician_administered': Nunca muestra Card00
 */