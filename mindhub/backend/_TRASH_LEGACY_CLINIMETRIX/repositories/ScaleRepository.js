/**
 * REPOSITORIO UNIVERSAL DE ESCALAS
 * Maneja todas las operaciones de base de datos relacionadas con escalas usando Prisma
 */

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class ScaleRepository {
  
  /**
   * Obtiene todas las escalas activas (usando Prisma)
   */
  async getAllActiveScales() {
    try {
      const scales = await prisma.scale.findMany({
        where: {
          isActive: true
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });
      
      return scales.map(scale => ({
        id: scale.id,
        name: scale.name,
        abbreviation: scale.abbreviation,
        version: scale.version,
        category: scale.category,
        subcategory: null, // No existe en assessment_scales
        description: scale.description,
        author: null, // No existe en assessment_scales
        publicationYear: null, // No existe en assessment_scales
        estimatedDurationMinutes: scale.estimatedDurationMinutes,
        administrationMode: scale.administrationMode,
        applicationType: this.mapApplicationType(scale.administrationMode), // Mapear desde administrationMode
        targetPopulation: scale.targetPopulation,
        totalItems: scale.totalItems,
        scoringMethod: scale.scoringMethod,
        scoreRangeMin: scale.scoreRangeMin || 0,
        scoreRangeMax: scale.scoreRangeMax || (scale.totalItems * 4),
        instructionsProfessional: scale.interpretationGuidelines,
        instructionsPatient: scale.interpretationGuidelines,
        isActive: scale.isActive
      }));
      
    } catch (error) {
      console.error('Error obteniendo escalas activas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una escala por ID con todos sus componentes
   */
  async getScaleById(scaleId) {
    try {
      const scale = await prisma.scale.findFirst({
        where: {
          id: scaleId,
          isActive: true
        },
        include: {
          items: {
            where: { isActive: true },
            orderBy: { itemNumber: 'asc' },
            include: {
              scale_item_specific_options: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' }
              }
            }
          },
          responseOptions: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
          },
          interpretationRules: {
            where: { isActive: true },
            orderBy: { minScore: 'asc' }
          },
          subscales: {
            where: { isActive: true },
            orderBy: { subscaleName: 'asc' }
          }
        }
      });
      
      if (!scale) {
        return null;
      }
      
      // Crear respuestas estándar según el tipo de escala
      const responseOptions = this.getStandardResponseOptions(scale);
      
      // Retornar escala con componentes usando Prisma
      return {
        id: scale.id,
        name: scale.name,
        abbreviation: scale.abbreviation,
        version: scale.version,
        category: scale.category,
        description: scale.description,
        estimatedDurationMinutes: scale.estimatedDurationMinutes,
        administrationMode: scale.administrationMode,
        applicationType: this.mapApplicationType(scale.administrationMode), // Mapear desde administrationMode
        targetPopulation: scale.targetPopulation,
        totalItems: scale.totalItems,
        scoringMethod: scale.scoringMethod,
        scoreRangeMin: scale.scoreRangeMin || 0,
        scoreRangeMax: scale.scoreRangeMax || (scale.totalItems * 4),
        isActive: scale.isActive,
        items: scale.items.length > 0 ? scale.items.map(item => ({
          id: item.id,
          number: item.itemNumber,
          itemNumber: item.itemNumber,
          text: item.itemText,
          itemText: item.itemText,
          subscale: item.subscale,
          responseGroup: item.responseGroup,
          helpText: item.help_text || null,
          questionType: 'likert',
          required: true,
          metadata: {}
        })) : this.generateBasicItems(scale),
        responseOptions: await this.buildResponseOptions(scale),
        interpretationRules: scale.interpretationRules.map(rule => ({
          minScore: rule.minScore,
          maxScore: rule.maxScore,
          severityLevel: rule.severityLevel,
          label: rule.interpretationLabel,
          color: rule.colorCode,
          description: rule.description,
          recommendations: rule.recommendations ? (typeof rule.recommendations === 'string' ? rule.recommendations.split(',') : rule.recommendations) : []
        })),
        subscales: scale.subscales.map(subscale => ({
          id: subscale.id,
          name: subscale.subscaleName,
          items: Array.isArray(subscale.items) ? subscale.items : (subscale.items ? JSON.parse(JSON.stringify(subscale.items)) : []),
          min_score: subscale.minScore,
          max_score: subscale.maxScore,
          description: subscale.description
        })),
        instructionsPatient: scale.instructionsPatient,
        instructionsProfessional: scale.instructionsProfessional
      };
      
    } catch (error) {
      console.error(`Error obteniendo escala ${scaleId}:`, error);
      throw error;
    }
  }

  /**
   * Genera opciones de respuesta estándar según el tipo de escala
   */
  getStandardResponseOptions(scale) {
    // Opciones Likert estándar 0-3
    return [
      { value: '0', label: 'Nunca', score: 0 },
      { value: '1', label: 'Varios días', score: 1 },
      { value: '2', label: 'Más de la mitad de los días', score: 2 },
      { value: '3', label: 'Casi todos los días', score: 3 }
    ];
  }

  /**
   * Genera ítems básicos para escalas sin ítems definidos
   */
  generateBasicItems(scale) {
    const items = [];
    for (let i = 1; i <= scale.totalItems; i++) {
      items.push({
        id: `${scale.id}-item-${i}`,
        number: i,
        text: `Ítem ${i} de ${scale.name}`,
        subscale: null,
        questionType: 'likert',
        required: true,
        metadata: {}
      });
    }
    return items;
  }

  /**
   * Busca escalas por término
   */
  async searchScales(searchTerm) {
    try {
      const scales = await prisma.scale.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm } },
            { abbreviation: { contains: searchTerm } },
            { description: { contains: searchTerm } }
          ]
        },
        orderBy: { name: 'asc' }
      });

      return scales.map(scale => this.transformScale(scale));
    } catch (error) {
      console.error(`Error buscando escalas con término ${searchTerm}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene escalas por categoría
   */
  async getScalesByCategory(category) {
    try {
      const scales = await prisma.scale.findMany({
        where: {
          category: category,
          isActive: true
        },
        orderBy: { name: 'asc' }
      });

      return scales.map(scale => this.transformScale(scale));
    } catch (error) {
      console.error(`Error obteniendo escalas por categoría ${category}:`, error);
      throw error;
    }
  }

  /**
   * Construye las opciones de respuesta combinando todas las fuentes
   */
  async buildResponseOptions(scale) {
    const responseOptions = [];
    
    // 1. Opciones globales de la escala
    if (scale.responseOptions && scale.responseOptions.length > 0) {
      scale.responseOptions.forEach(option => {
        responseOptions.push({
          value: option.optionValue,
          label: option.optionLabel,
          score: option.scoreValue,
          group: option.responseGroup || null
        });
      });
    }
    
    // 2. Si no hay opciones globales pero sí ítems con responseGroup, consultar por grupo
    if (responseOptions.length === 0 && scale.items.some(item => item.responseGroup)) {
      // Obtener opciones agrupadas por responseGroup
      const groupedOptions = await prisma.scaleResponseOption.findMany({
        where: {
          scaleId: scale.id,
          isActive: true
        },
        orderBy: [
          { responseGroup: 'asc' },
          { displayOrder: 'asc' }
        ]
      });
      
      groupedOptions.forEach(option => {
        responseOptions.push({
          value: option.optionValue,
          label: option.optionLabel,
          score: option.scoreValue,
          group: option.responseGroup
        });
      });
    }
    
    // 3. Si aún no hay opciones, usar estándar
    if (responseOptions.length === 0) {
      return this.getStandardResponseOptions(scale);
    }
    
    return responseOptions;
  }

  /**
   * Enriquece los ítems con sus opciones específicas y de grupo
   */
  async enrichItemsWithOptions(scale) {
    if (!scale.items || scale.items.length === 0) {
      return scale;
    }

    // Obtener todas las opciones específicas de una vez
    const allSpecificOptions = await prisma.scaleItemSpecificOption.findMany({
      where: {
        scaleId: scale.id,
        isActive: true
      },
      orderBy: [{ itemNumber: 'asc' }, { displayOrder: 'asc' }]
    });

    // Obtener todas las opciones de grupo de una vez
    const allGroupOptions = await prisma.scaleResponseOption.findMany({
      where: {
        scaleId: scale.id,
        isActive: true
      },
      orderBy: [{ responseGroup: 'asc' }, { displayOrder: 'asc' }]
    });

    // Enriquecer cada ítem
    const enrichedItems = scale.items.map(item => {
      // Opciones específicas del ítem
      const specificOptions = allSpecificOptions
        .filter(opt => opt.itemNumber === item.itemNumber)
        .map(opt => ({
          value: opt.optionValue,
          label: opt.optionLabel,
          score: opt.scoreValue
        }));

      // Opciones del grupo de respuesta
      const groupOptions = allGroupOptions
        .filter(opt => opt.responseGroup === item.responseGroup)
        .map(opt => ({
          value: opt.optionValue,
          label: opt.optionLabel,
          score: opt.scoreValue,
          group: opt.responseGroup
        }));

      return {
        ...item,
        specificOptions,
        responseOptions: groupOptions
      };
    });

    return {
      ...scale,
      items: enrichedItems
    };
  }

  /**
   * Mapea administrationMode a applicationType
   */
  mapApplicationType(administrationMode) {
    switch (administrationMode) {
      case 'clinician_administered':
        return 'heteroaplicada';
      case 'self_administered':
        return 'autoaplicada';
      case 'both':
        return 'flexible';
      default:
        return 'flexible';
    }
  }

  /**
   * Transforma un modelo de Prisma al formato esperado
   */
  transformScale(scale) {
    return {
      id: scale.id,
      name: scale.name,
      abbreviation: scale.abbreviation,
      version: scale.version,
      category: scale.category,
      description: scale.description,
      estimatedDurationMinutes: scale.estimatedDurationMinutes,
      administrationMode: scale.administrationMode,
      applicationType: scale.applicationType,
      targetPopulation: scale.targetPopulation,
      totalItems: scale.totalItems,
      scoringMethod: scale.scoringMethod,
      isActive: scale.isActive
    };
  }
}

module.exports = ScaleRepository;