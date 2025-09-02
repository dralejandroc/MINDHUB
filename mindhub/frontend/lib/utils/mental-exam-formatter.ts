/**
 * Mental Exam Formatter - Utility para formatear examen mental estructurado
 * Convierte datos estructurados a formato legible para almacenamiento y visualización
 */

export interface MentalExamData {
  // Apariencia y Comportamiento
  appearance: string;
  attitude: string;
  consciousness: string;
  customAppearance: string;
  // Habla y Lenguaje
  speechRate: string;
  speechVolume: string;
  speechFluency: string;
  customSpeech: string;
  // Afecto y Estado de Ánimo
  affectIntensity: string;
  affectQuality: string;
  moodState: string;
  customAffect: string;
  // Pensamiento
  thoughtProcess: string;
  thoughtContent: string;
  customThought: string;
  // Percepción
  perceptions: string;
  customPerceptions: string;
  // Cognición
  orientation: string;
  attention: string;
  memory: string;
  customCognition: string;
  // Insight y Juicio
  insight: string;
  judgment: string;
  customInsightJudgment: string;
  // Resumen general
  generalSummary: string;
}

export interface FormattedMentalExam {
  structuredData: MentalExamData;
  readableSummary: string;
  compactSummary: string; // Para impresión económica
}

export class MentalExamFormatter {
  /**
   * Formatea el examen mental estructurado para guardado en base de datos
   */
  static formatForStorage(data: MentalExamData): FormattedMentalExam {
    const readableSummary = this.generateReadableSummary(data);
    const compactSummary = this.generateCompactSummary(data);
    
    return {
      structuredData: data,
      readableSummary,
      compactSummary
    };
  }

  /**
   * Genera un resumen legible completo del examen mental
   */
  private static generateReadableSummary(data: MentalExamData): string {
    const sections: string[] = [];

    // 1. Apariencia y Comportamiento
    if (data.appearance || data.attitude || data.consciousness || data.customAppearance) {
      const appearance = [
        data.appearance && `Apariencia: ${data.appearance}`,
        data.attitude && `Actitud: ${data.attitude}`,
        data.consciousness && `Conciencia: ${data.consciousness}`,
        data.customAppearance && `Observaciones: ${data.customAppearance}`
      ].filter(Boolean).join('. ');
      
      if (appearance) sections.push(`APARIENCIA Y COMPORTAMIENTO: ${appearance}.`);
    }

    // 2. Habla y Lenguaje
    if (data.speechRate || data.speechVolume || data.speechFluency || data.customSpeech) {
      const speech = [
        data.speechRate && `Velocidad: ${data.speechRate}`,
        data.speechVolume && `Volumen: ${data.speechVolume}`,
        data.speechFluency && `Fluidez: ${data.speechFluency}`,
        data.customSpeech && `Observaciones: ${data.customSpeech}`
      ].filter(Boolean).join('. ');
      
      if (speech) sections.push(`HABLA Y LENGUAJE: ${speech}.`);
    }

    // 3. Afecto y Estado de Ánimo
    if (data.affectIntensity || data.affectQuality || data.moodState || data.customAffect) {
      const affect = [
        data.affectIntensity && `Intensidad: ${data.affectIntensity}`,
        data.affectQuality && `Cualidad: ${data.affectQuality}`,
        data.moodState && `Estado reportado: "${data.moodState}"`,
        data.customAffect && `Observaciones: ${data.customAffect}`
      ].filter(Boolean).join('. ');
      
      if (affect) sections.push(`AFECTO Y ESTADO DE ÁNIMO: ${affect}.`);
    }

    // 4. Pensamiento
    if (data.thoughtProcess || data.thoughtContent || data.customThought) {
      const thought = [
        data.thoughtProcess && `Proceso: ${data.thoughtProcess}`,
        data.thoughtContent && `Contenido: ${data.thoughtContent}`,
        data.customThought && `Observaciones: ${data.customThought}`
      ].filter(Boolean).join('. ');
      
      if (thought) sections.push(`PENSAMIENTO: ${thought}.`);
    }

    // 5. Percepción
    if (data.perceptions || data.customPerceptions) {
      const perception = [
        data.perceptions && data.perceptions !== 'Sin alteraciones reportadas' && `Alteraciones: ${data.perceptions}`,
        data.customPerceptions && `Detalles: ${data.customPerceptions}`
      ].filter(Boolean).join('. ');
      
      if (perception) sections.push(`PERCEPCIÓN: ${perception}.`);
      else if (data.perceptions === 'Sin alteraciones reportadas' || (!data.perceptions && !data.customPerceptions)) {
        sections.push('PERCEPCIÓN: Sin alteraciones reportadas.');
      }
    }

    // 6. Cognición
    if (data.orientation || data.attention || data.memory || data.customCognition) {
      const cognition = [
        data.orientation && `Orientación: ${data.orientation}`,
        data.attention && `Atención: ${data.attention}`,
        data.memory && `Memoria: ${data.memory}`,
        data.customCognition && `Evaluación adicional: ${data.customCognition}`
      ].filter(Boolean).join('. ');
      
      if (cognition) sections.push(`COGNICIÓN: ${cognition}.`);
    }

    // 7. Insight y Juicio
    if (data.insight || data.judgment || data.customInsightJudgment) {
      const insightJudgment = [
        data.insight && `Insight: ${data.insight}`,
        data.judgment && `Juicio: ${data.judgment}`,
        data.customInsightJudgment && `Observaciones: ${data.customInsightJudgment}`
      ].filter(Boolean).join('. ');
      
      if (insightJudgment) sections.push(`INSIGHT Y JUICIO: ${insightJudgment}.`);
    }

    // 8. Resumen General
    if (data.generalSummary) {
      sections.push(`IMPRESIÓN GENERAL: ${data.generalSummary}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Genera un resumen compacto para impresión económica
   */
  private static generateCompactSummary(data: MentalExamData): string {
    const items: string[] = [];

    // Solo incluir elementos con contenido significativo
    if (data.appearance) items.push(`Apariencia: ${data.appearance}`);
    if (data.attitude && data.attitude !== 'cooperativo') items.push(`Actitud: ${data.attitude}`);
    if (data.consciousness && data.consciousness !== 'alerta') items.push(`Conciencia: ${data.consciousness}`);
    
    if (data.speechRate && data.speechRate !== 'normal') items.push(`Habla ${data.speechRate}`);
    if (data.speechVolume && data.speechVolume !== 'normal') items.push(`Vol. ${data.speechVolume}`);
    if (data.speechFluency && data.speechFluency !== 'clara') items.push(`Fluidez ${data.speechFluency}`);
    
    if (data.affectIntensity && data.affectIntensity !== 'normal') items.push(`Afecto ${data.affectIntensity}`);
    if (data.affectQuality && data.affectQuality !== 'eutímico') items.push(`${data.affectQuality}`);
    if (data.moodState) items.push(`Ánimo: "${data.moodState}"`);
    
    if (data.thoughtProcess && data.thoughtProcess !== 'lineal y dirigido al objetivo') items.push(`Pensamiento ${data.thoughtProcess}`);
    if (data.thoughtContent) items.push(`Contenido: ${data.thoughtContent}`);
    
    if (data.perceptions && data.perceptions !== 'Sin alteraciones reportadas') items.push(`Percepción: ${data.perceptions}`);
    
    if (data.orientation) items.push(`Orient. ${data.orientation}`);
    if (data.attention) items.push(`Atenc. ${data.attention}`);
    if (data.memory) items.push(`Memoria ${data.memory}`);
    
    if (data.insight && data.insight !== 'bueno') items.push(`Insight ${data.insight}`);
    if (data.judgment && data.judgment !== 'bueno') items.push(`Juicio ${data.judgment}`);

    // Observaciones personalizadas importantes
    const customObs = [
      data.customAppearance,
      data.customSpeech,
      data.customAffect,
      data.customThought,
      data.customPerceptions,
      data.customCognition,
      data.customInsightJudgment
    ].filter(Boolean);

    if (customObs.length > 0) {
      items.push(`Obs: ${customObs.join('; ')}`);
    }

    if (data.generalSummary) {
      items.push(`Impresión: ${data.generalSummary}`);
    }

    return items.length > 0 ? items.join(' • ') : 'Examen mental dentro de parámetros normales';
  }

  /**
   * Convierte datos del formulario legacy al nuevo formato
   */
  static convertLegacyData(legacyData: any): MentalExamData {
    return {
      appearance: '',
      attitude: legacyData.actitud || '',
      consciousness: legacyData.conciencia || '',
      customAppearance: legacyData.apariencia || legacyData.descripcionInspeccion || '',
      speechRate: '',
      speechVolume: '',
      speechFluency: '',
      customSpeech: legacyData.lenguaje || '',
      affectIntensity: '',
      affectQuality: '',
      moodState: '',
      customAffect: legacyData.afecto || '',
      thoughtProcess: '',
      thoughtContent: '',
      customThought: legacyData.pensamientoPrincipal || legacyData.pensamientoDetalles || '',
      perceptions: '',
      customPerceptions: legacyData.sensopercepcion || '',
      orientation: legacyData.orientacion || '',
      attention: legacyData.atencion || '',
      memory: legacyData.memoria || '',
      customCognition: '',
      insight: '',
      judgment: '',
      customInsightJudgment: '',
      generalSummary: ''
    };
  }

  /**
   * Verifica si el examen mental tiene contenido significativo
   */
  static hasSignificantContent(data: MentalExamData): boolean {
    const fields = Object.values(data);
    return fields.some(field => field && field.trim().length > 0);
  }
}