/**
 * MODELO DE OPCIÓN DE RESPUESTA
 * Representa una opción de respuesta disponible para una escala
 */

class ScaleResponseOption {
  constructor(data = {}) {
    this.id = data.id;
    this.scaleId = data.scale_id;
    this.optionValue = data.option_value;
    this.optionLabel = data.option_label;
    this.scoreValue = data.score_value;
    this.displayOrder = data.display_order || 0;
    this.isActive = data.is_active !== false;
    this.createdAt = data.created_at;
  }

  /**
   * Valida que la opción tenga todos los datos necesarios
   */
  validate() {
    const errors = [];

    if (!this.id) errors.push('ID es requerido');
    if (!this.scaleId) errors.push('Scale ID es requerido');
    if (!this.optionValue) errors.push('Valor de opción es requerido');
    if (!this.optionLabel) errors.push('Etiqueta de opción es requerida');
    if (this.scoreValue === undefined || this.scoreValue === null) errors.push('Valor de puntuación es requerido');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convierte a formato JSON para API
   */
  toJSON() {
    return {
      id: this.id,
      scaleId: this.scaleId,
      optionValue: this.optionValue,
      optionLabel: this.optionLabel,
      scoreValue: this.scoreValue,
      displayOrder: this.displayOrder,
      isActive: this.isActive
    };
  }

  /**
   * Convierte a formato compatible con el frontend existente
   */
  toLegacyFormat() {
    return {
      value: this.optionValue,
      label: this.optionLabel,
      score: this.scoreValue
    };
  }

  /**
   * Convierte a formato de base de datos
   */
  toDatabaseFormat() {
    return {
      id: this.id,
      scale_id: this.scaleId,
      option_value: this.optionValue,
      option_label: this.optionLabel,
      score_value: this.scoreValue,
      display_order: this.displayOrder,
      is_active: this.isActive
    };
  }

  /**
   * Crea una instancia desde datos de base de datos
   */
  static fromDatabase(dbData) {
    return new ScaleResponseOption(dbData);
  }

  /**
   * Crea una instancia desde datos de API
   */
  static fromAPI(apiData) {
    return new ScaleResponseOption({
      id: apiData.id,
      scale_id: apiData.scaleId,
      option_value: apiData.optionValue,
      option_label: apiData.optionLabel,
      score_value: apiData.scoreValue,
      display_order: apiData.displayOrder,
      is_active: apiData.isActive
    });
  }

  /**
   * Genera un ID único para la opción
   */
  static generateId(scaleId, optionValue) {
    return `${scaleId}_option_${optionValue}`;
  }

  /**
   * Crea opciones de respuesta estándar para escalas tipo Likert
   */
  static createLikertOptions(scaleId, labels) {
    return labels.map((label, index) => 
      new ScaleResponseOption({
        id: ScaleResponseOption.generateId(scaleId, index),
        scale_id: scaleId,
        option_value: index.toString(),
        option_label: label,
        score_value: index,
        display_order: index,
        is_active: true
      })
    );
  }

  /**
   * Crea opciones de respuesta estándar para escalas sí/no
   */
  static createYesNoOptions(scaleId) {
    return [
      new ScaleResponseOption({
        id: ScaleResponseOption.generateId(scaleId, 'no'),
        scale_id: scaleId,
        option_value: 'no',
        option_label: 'No',
        score_value: 0,
        display_order: 0,
        is_active: true
      }),
      new ScaleResponseOption({
        id: ScaleResponseOption.generateId(scaleId, 'yes'),
        scale_id: scaleId,
        option_value: 'yes',
        option_label: 'Sí',
        score_value: 1,
        display_order: 1,
        is_active: true
      })
    ];
  }
}

module.exports = ScaleResponseOption;