/**
 * MODELO DE ITEM DE ESCALA
 * Representa un item individual dentro de una escala
 */

class ScaleItem {
  constructor(data = {}) {
    this.id = data.id;
    this.scaleId = data.scale_id;
    this.itemNumber = data.item_number;
    this.itemText = data.item_text;
    this.itemCode = data.item_code;
    this.subscale = data.subscale;
    this.reverseScored = data.reverse_scored || false;
    this.isActive = data.is_active !== false;
    this.createdAt = data.created_at;
  }

  /**
   * Valida que el item tenga todos los datos necesarios
   */
  validate() {
    const errors = [];

    if (!this.id) errors.push('ID es requerido');
    if (!this.scaleId) errors.push('Scale ID es requerido');
    if (!this.itemNumber || this.itemNumber < 1) errors.push('Número de item debe ser mayor a 0');
    if (!this.itemText) errors.push('Texto del item es requerido');

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
      itemNumber: this.itemNumber,
      itemText: this.itemText,
      itemCode: this.itemCode,
      subscale: this.subscale,
      reverseScored: this.reverseScored,
      isActive: this.isActive
    };
  }

  /**
   * Convierte a formato compatible con el frontend existente
   */
  toLegacyFormat() {
    return {
      id: this.id,
      number: this.itemNumber,
      text: this.itemText,
      code: this.itemCode,
      subscale: this.subscale,
      reverseScored: this.reverseScored
    };
  }

  /**
   * Convierte a formato de base de datos
   */
  toDatabaseFormat() {
    return {
      id: this.id,
      scale_id: this.scaleId,
      item_number: this.itemNumber,
      item_text: this.itemText,
      item_code: this.itemCode,
      subscale: this.subscale,
      reverse_scored: this.reverseScored,
      is_active: this.isActive
    };
  }

  /**
   * Aplica puntuación inversa si está configurada
   */
  applyReverseScoring(score, maxScore) {
    if (this.reverseScored) {
      return maxScore - score;
    }
    return score;
  }

  /**
   * Crea una instancia desde datos de base de datos
   */
  static fromDatabase(dbData) {
    return new ScaleItem(dbData);
  }

  /**
   * Crea una instancia desde datos de API
   */
  static fromAPI(apiData) {
    return new ScaleItem({
      id: apiData.id,
      scale_id: apiData.scaleId,
      item_number: apiData.itemNumber,
      item_text: apiData.itemText,
      item_code: apiData.itemCode,
      subscale: apiData.subscale,
      reverse_scored: apiData.reverseScored,
      is_active: apiData.isActive
    });
  }

  /**
   * Genera un ID único para el item
   */
  static generateId(scaleId, itemNumber) {
    return `${scaleId}_item_${itemNumber}`;
  }
}

module.exports = ScaleItem;