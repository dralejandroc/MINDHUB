/**
 * Print Configuration Utility - Configuraciones personalizables para impresión
 * Permite customizar headers, logos, estilos y formato de documentos impresos
 */

export interface PrintConfig {
  // Información del doctor/clínica (configurable)
  clinicName: string;
  doctorName: string;
  professionalId: string;
  phone: string;
  email: string;
  address?: string;
  
  // Configuración de impresión
  paperSize: 'letter' | 'a4';
  margins: 'compact' | 'normal' | 'wide';
  fontSize: 'small' | 'normal' | 'large';
  
  // Configuración específica de recetas
  prescription: {
    includeHeader: boolean;
    includeFooter: boolean;
    includePatientInfo: boolean;
    includeAge: boolean;
    includeDate: boolean;
    rxSymbol: boolean;
    watermark?: string;
    numberedMedications: boolean;
    compactFormat: boolean;
  };
  
  // Configuración de consultas
  consultation: {
    includeFullMentalExam: boolean;
    compactLayout: boolean;
    includeNextAppointment: boolean;
    groupSections: boolean;
  };
  
  // Configuración de expedientes
  medicalRecord: {
    maxConsultationsPerPage: number;
    includeSummaryOnly: boolean;
    chronologicalOrder: boolean;
  };
}

// Configuración por defecto
export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  clinicName: 'MindHub Clínica',
  doctorName: 'Dr. Alejandro González',
  professionalId: '12345678',
  phone: '(555) 123-4567',
  email: 'contacto@mindhub.clinic',
  paperSize: 'letter',
  margins: 'compact',
  fontSize: 'normal',
  prescription: {
    includeHeader: true,
    includeFooter: true,
    includePatientInfo: true,
    includeAge: true,
    includeDate: true,
    rxSymbol: true,
    numberedMedications: true,
    compactFormat: true
  },
  consultation: {
    includeFullMentalExam: false, // Solo versión compacta por defecto
    compactLayout: true,
    includeNextAppointment: true,
    groupSections: true
  },
  medicalRecord: {
    maxConsultationsPerPage: 10,
    includeSummaryOnly: true,
    chronologicalOrder: true
  }
};

export class PrintConfigManager {
  private static CONFIG_KEY = 'mindhub_print_config';
  
  /**
   * Obtiene la configuración actual (guardada en localStorage o por defecto)
   */
  static getCurrentConfig(): PrintConfig {
    if (typeof window === 'undefined') return DEFAULT_PRINT_CONFIG;
    
    try {
      const saved = localStorage.getItem(this.CONFIG_KEY);
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        // Merge con configuración por defecto para mantener nuevas propiedades
        return { ...DEFAULT_PRINT_CONFIG, ...parsedConfig };
      }
    } catch (error) {
      console.warn('Error loading print config from localStorage:', error);
    }
    
    return DEFAULT_PRINT_CONFIG;
  }
  
  /**
   * Guarda la configuración actual
   */
  static saveConfig(config: Partial<PrintConfig>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const currentConfig = this.getCurrentConfig();
      const updatedConfig = { ...currentConfig, ...config };
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(updatedConfig));
      console.log('✅ Print configuration saved successfully');
    } catch (error) {
      console.error('❌ Error saving print config:', error);
    }
  }
  
  /**
   * Resetea la configuración a valores por defecto
   */
  static resetConfig(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.CONFIG_KEY);
    console.log('🔄 Print configuration reset to defaults');
  }
  
  /**
   * Genera los estilos CSS basados en la configuración
   */
  static generateStyles(config: PrintConfig): string {
    const marginSizes = {
      compact: '0.5in',
      normal: '1in',
      wide: '1.5in'
    };
    
    const fontSizes = {
      small: {
        base: '10px',
        header: '14px',
        title: '12px'
      },
      normal: {
        base: '11px',
        header: '16px',
        title: '14px'
      },
      large: {
        base: '12px',
        header: '18px',
        title: '16px'
      }
    };
    
    const currentFont = fontSizes[config.fontSize];
    const margin = marginSizes[config.margins];
    
    return `
      @page { 
        margin: ${margin}; 
        size: ${config.paperSize}; 
      }
      body { 
        font-family: Arial, sans-serif; 
        font-size: ${currentFont.base}; 
        line-height: ${config.margins === 'compact' ? '1.2' : '1.4'}; 
        color: #000; 
        margin: 0;
        padding: 0;
      }
      .header { 
        text-align: center; 
        border-bottom: 2px solid #000; 
        padding-bottom: ${config.margins === 'compact' ? '6px' : '10px'}; 
        margin-bottom: ${config.margins === 'compact' ? '10px' : '15px'}; 
      }
      .clinic-name { 
        font-size: ${currentFont.header}; 
        font-weight: bold; 
        margin-bottom: 2px; 
      }
      .clinic-info { 
        font-size: ${parseInt(currentFont.base) - 1}px; 
        margin-bottom: 3px; 
      }
      .patient-info { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: ${config.margins === 'compact' ? '8px' : '12px'}; 
        padding: ${config.margins === 'compact' ? '4px' : '8px'}; 
        background: #f5f5f5; 
        font-size: ${parseInt(currentFont.base) - 1}px;
        flex-wrap: wrap;
      }
      .section { 
        margin-bottom: ${config.margins === 'compact' ? '6px' : '10px'}; 
      }
      .section-title { 
        font-weight: bold; 
        font-size: ${currentFont.title}; 
        text-transform: uppercase; 
        border-bottom: 1px solid #ccc; 
        margin-bottom: ${config.margins === 'compact' ? '3px' : '5px'}; 
        padding-bottom: 1px;
      }
      .section-content { 
        font-size: ${currentFont.base}; 
        line-height: ${config.margins === 'compact' ? '1.2' : '1.3'}; 
      }
      .compact-row { 
        display: flex; 
        gap: 15px; 
        margin-bottom: ${config.margins === 'compact' ? '2px' : '4px'}; 
        flex-wrap: wrap;
      }
      .compact-row > div { 
        flex: 1; 
        min-width: 120px;
      }
      .signature-area {
        margin-top: ${config.margins === 'compact' ? '15px' : '25px'};
        text-align: center;
      }
      .signature-line {
        border-bottom: 1px solid #000;
        width: 200px;
        margin: 15px auto 5px auto;
      }
      .footer { 
        position: fixed; 
        bottom: ${margin}; 
        left: ${margin}; 
        right: ${margin}; 
        text-align: center; 
        font-size: ${parseInt(currentFont.base) - 2}px; 
        border-top: 1px solid #ccc; 
        padding-top: 3px; 
      }
      
      /* Estilos específicos para recetas */
      .prescription-header { 
        text-align: center; 
        font-size: ${currentFont.header}; 
        font-weight: bold; 
        margin-bottom: ${config.margins === 'compact' ? '10px' : '15px'}; 
      }
      .rx-symbol { 
        font-size: ${parseInt(currentFont.header) + 6}px; 
        font-weight: bold; 
        margin: ${config.margins === 'compact' ? '8px 0' : '12px 0'}; 
      }
      .medication { 
        margin: ${config.margins === 'compact' ? '6px 0' : '8px 0'}; 
        padding: ${config.margins === 'compact' ? '4px' : '6px'}; 
        border-left: 3px solid #007bff; 
        page-break-inside: avoid;
      }
      .medication-name { 
        font-weight: bold; 
        font-size: ${currentFont.title}; 
      }
      .medication-details { 
        font-size: ${parseInt(currentFont.base) - 1}px; 
        margin-left: 8px; 
        line-height: 1.3;
      }
      
      /* Media queries para impresión */
      @media print {
        .no-print { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page-break { page-break-before: always; }
        .avoid-break { page-break-inside: avoid; }
      }
    `;
  }
  
  /**
   * Valida si la configuración es válida
   */
  static validateConfig(config: Partial<PrintConfig>): boolean {
    // Validaciones básicas
    if (config.clinicName && config.clinicName.trim().length === 0) return false;
    if (config.doctorName && config.doctorName.trim().length === 0) return false;
    if (config.paperSize && !['letter', 'a4'].includes(config.paperSize)) return false;
    if (config.margins && !['compact', 'normal', 'wide'].includes(config.margins)) return false;
    if (config.fontSize && !['small', 'normal', 'large'].includes(config.fontSize)) return false;
    
    return true;
  }
  
  /**
   * Obtiene configuración optimizada para impresión económica
   */
  static getEconomicConfig(): PrintConfig {
    return {
      ...DEFAULT_PRINT_CONFIG,
      margins: 'compact',
      fontSize: 'small',
      prescription: {
        ...DEFAULT_PRINT_CONFIG.prescription,
        compactFormat: true,
        includeFooter: false
      },
      consultation: {
        ...DEFAULT_PRINT_CONFIG.consultation,
        compactLayout: true,
        includeFullMentalExam: false
      },
      medicalRecord: {
        ...DEFAULT_PRINT_CONFIG.medicalRecord,
        maxConsultationsPerPage: 15,
        includeSummaryOnly: true
      }
    };
  }
}