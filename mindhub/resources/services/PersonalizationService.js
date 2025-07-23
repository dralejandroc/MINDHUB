/**
 * Personalization Service for MindHub Resources Library
 * 
 * Handles text personalization with variables, PDF generation with branding,
 * and content customization for psychoeducational resources.
 */

const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');

class PersonalizationService {
  constructor(config = {}) {
    this.config = {
      defaultBranding: {
        logoPath: config.logoPath || null,
        primaryColor: config.primaryColor || '#2196F3',
        secondaryColor: config.secondaryColor || '#666666',
        fontFamily: config.fontFamily || 'Helvetica',
        fontSize: config.fontSize || 12
      },
      templateEngine: config.templateEngine || 'handlebars',
      maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
      ...config
    };

    // Initialize template engine
    this.handlebars = require('handlebars');
    this.registerCustomHelpers();
  }

  /**
   * Personalize text content with variables
   */
  async personalizeText(rawText, variables = {}) {
    try {
      // Prepare standard variables
      const standardVariables = {
        nombrePaciente: variables.nombrePaciente || '[Nombre del Paciente]',
        nombreProfesional: variables.nombreProfesional || '[Nombre del Profesional]',
        nombreClinica: variables.nombreClinica || '[Nombre de la Clínica]',
        fechaHoy: variables.fechaHoy || new Date().toLocaleDateString('es-MX'),
        fechaActual: new Date().toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        ...variables
      };

      // Use Handlebars for template processing
      const template = this.handlebars.compile(rawText);
      const personalizedText = template(standardVariables);

      return personalizedText;

    } catch (error) {
      console.error('Error personalizing text:', error);
      // Return original text with basic variable replacement as fallback
      return this.basicVariableReplacement(rawText, variables);
    }
  }

  /**
   * Generate personalized PDF with branding
   */
  async generatePersonalizedPDF(content, variables = {}, brandingOptions = {}) {
    try {
      // Merge branding options with defaults
      const branding = {
        ...this.config.defaultBranding,
        ...brandingOptions
      };

      // Create new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 80,
          bottom: 80,
          left: 60,
          right: 60
        }
      });

      // Buffer to collect PDF data
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        doc.on('error', reject);

        // Add header with logo and clinic name
        this.addPDFHeader(doc, branding, variables);

        // Add personalized content
        this.addPDFContent(doc, content, branding);

        // Add footer
        this.addPDFFooter(doc, branding, variables);

        // Finalize the PDF
        doc.end();
      });

    } catch (error) {
      console.error('Error generating personalized PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Personalize existing PDF (overlay text on existing PDF)
   */
  async personalizePDF(originalPdfBuffer, variables = {}, brandingOptions = {}) {
    try {
      // For now, create a new PDF with the variables
      // In a full implementation, you would use pdf-lib to overlay on existing PDF
      const PDFLib = require('pdf-lib');
      
      const existingPdfDoc = await PDFLib.PDFDocument.load(originalPdfBuffer);
      const pages = existingPdfDoc.getPages();
      
      // Add personalization to first page
      if (pages.length > 0) {
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        // Add patient name in header
        if (variables.nombrePaciente) {
          firstPage.drawText(`Paciente: ${variables.nombrePaciente}`, {
            x: 50,
            y: height - 30,
            size: 10,
            color: PDFLib.rgb(0, 0, 0)
          });
        }
        
        // Add clinic name in footer
        if (variables.nombreClinica) {
          firstPage.drawText(variables.nombreClinica, {
            x: 50,
            y: 30,
            size: 8,
            color: PDFLib.rgb(0.5, 0.5, 0.5)
          });
        }
      }

      const pdfBytes = await existingPdfDoc.save();
      return Buffer.from(pdfBytes);

    } catch (error) {
      console.error('Error personalizing existing PDF:', error);
      // Return original PDF if personalization fails
      return originalPdfBuffer;
    }
  }

  /**
   * Add branding to existing PDF
   */
  async addBrandingToPDF(pdfBuffer, clinicSettings = {}) {
    try {
      const PDFLib = require('pdf-lib');
      const { rgb, StandardFonts, degrees } = PDFLib;
      
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      
      // Load standard font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Branding configuration
      const branding = {
        clinicName: clinicSettings.clinicName || 'MindHub Healthcare',
        logoUrl: clinicSettings.logoUrl,
        primaryColor: clinicSettings.primaryColor || { r: 0.13, g: 0.59, b: 0.95 }, // Blue
        secondaryColor: clinicSettings.secondaryColor || { r: 0.4, g: 0.4, b: 0.4 }, // Gray
        contactInfo: clinicSettings.contactInfo || {},
        watermark: clinicSettings.watermark !== false, // Default true
        headerFooter: clinicSettings.headerFooter !== false // Default true
      };
      
      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Add watermark (diagonal, semi-transparent)
        if (branding.watermark) {
          page.drawText(branding.clinicName.toUpperCase(), {
            x: width / 2 - 100,
            y: height / 2,
            size: 40,
            font: boldFont,
            color: rgb(branding.primaryColor.r, branding.primaryColor.g, branding.primaryColor.b),
            opacity: 0.1,
            rotate: degrees(-45)
          });
        }
        
        // Add header on first page
        if (i === 0 && branding.headerFooter) {
          // Clinic name in header
          page.drawText(branding.clinicName, {
            x: 50,
            y: height - 40,
            size: 16,
            font: boldFont,
            color: rgb(branding.primaryColor.r, branding.primaryColor.g, branding.primaryColor.b)
          });
          
          // Contact info
          let yOffset = height - 60;
          if (branding.contactInfo.phone) {
            page.drawText(`Tel: ${branding.contactInfo.phone}`, {
              x: 50,
              y: yOffset,
              size: 9,
              font: font,
              color: rgb(branding.secondaryColor.r, branding.secondaryColor.g, branding.secondaryColor.b)
            });
            yOffset -= 12;
          }
          
          if (branding.contactInfo.email) {
            page.drawText(`Email: ${branding.contactInfo.email}`, {
              x: 50,
              y: yOffset,
              size: 9,
              font: font,
              color: rgb(branding.secondaryColor.r, branding.secondaryColor.g, branding.secondaryColor.b)
            });
            yOffset -= 12;
          }
          
          if (branding.contactInfo.website) {
            page.drawText(`Web: ${branding.contactInfo.website}`, {
              x: 50,
              y: yOffset,
              size: 9,
              font: font,
              color: rgb(branding.secondaryColor.r, branding.secondaryColor.g, branding.secondaryColor.b)
            });
          }
          
          // Add line separator
          page.drawLine({
            start: { x: 50, y: height - 80 },
            end: { x: width - 50, y: height - 80 },
            thickness: 1,
            color: rgb(branding.primaryColor.r, branding.primaryColor.g, branding.primaryColor.b)
          });
        }
        
        // Add footer on all pages
        if (branding.headerFooter) {
          // Page number
          page.drawText(`Página ${i + 1} de ${pages.length}`, {
            x: width / 2 - 40,
            y: 30,
            size: 8,
            font: font,
            color: rgb(branding.secondaryColor.r, branding.secondaryColor.g, branding.secondaryColor.b)
          });
          
          // Date
          const date = new Date().toLocaleDateString('es-MX');
          page.drawText(date, {
            x: width - 100,
            y: 30,
            size: 8,
            font: font,
            color: rgb(branding.secondaryColor.r, branding.secondaryColor.g, branding.secondaryColor.b)
          });
          
          // Footer line
          page.drawLine({
            start: { x: 50, y: 50 },
            end: { x: width - 50, y: 50 },
            thickness: 0.5,
            color: rgb(branding.secondaryColor.r, branding.secondaryColor.g, branding.secondaryColor.b)
          });
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('Error adding branding to PDF:', error);
      throw new Error(`Failed to add branding: ${error.message}`);
    }
  }

  /**
   * Process and format text automatically
   */
  async processTextAutomatically(rawText, options = {}) {
    try {
      const {
        template = 'default',
        formatting = true,
        variables = {},
        brandingOptions = {}
      } = options;

      // Step 1: Clean and normalize text
      let processedText = this.normalizeText(rawText);
      
      // Step 2: Apply automatic formatting
      if (formatting) {
        processedText = this.applySmartFormatting(processedText);
      }
      
      // Step 3: Apply template structure
      processedText = this.applyTemplate(processedText, template);
      
      // Step 4: Personalize with variables
      processedText = await this.personalizeText(processedText, variables);
      
      // Step 5: Generate PDF with branding
      const pdfBuffer = await this.generatePersonalizedPDF(
        processedText, 
        variables, 
        brandingOptions
      );
      
      return {
        processedText,
        pdfBuffer,
        preview: processedText.substring(0, 500) + '...',
        wordCount: processedText.split(/\s+/).length,
        estimatedPages: Math.ceil(processedText.length / 3000) // Rough estimate
      };
      
    } catch (error) {
      console.error('Error processing text automatically:', error);
      throw new Error(`Failed to process text: ${error.message}`);
    }
  }

  /**
   * Normalize text (clean up spacing, line breaks, etc.)
   */
  normalizeText(text) {
    return text
      .trim()
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')       // Max 2 consecutive line breaks
      .replace(/\s+/g, ' ')             // Normalize spaces
      .replace(/\n\s+/g, '\n')          // Remove leading spaces after line breaks
      .replace(/\s+\n/g, '\n');         // Remove trailing spaces before line breaks
  }

  /**
   * Apply smart formatting to text
   */
  applySmartFormatting(text) {
    // Detect and format lists
    text = text.replace(/^[-*]\s+(.+)$/gm, '• $1');
    
    // Detect and format numbered lists
    text = text.replace(/^(\d+)\.\s+(.+)$/gm, '$1. $2');
    
    // Detect potential headers (lines ending with :)
    text = text.replace(/^(.+):$/gm, '## $1');
    
    // Detect all caps lines as headers
    text = text.replace(/^([A-Z\s]{10,})$/gm, (match) => {
      return '# ' + match.charAt(0) + match.slice(1).toLowerCase();
    });
    
    // Add spacing around headers
    text = text.replace(/(#{1,3}\s.+)/g, '\n$1\n');
    
    // Clean up excessive spacing
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text;
  }

  /**
   * Apply template structure to text
   */
  applyTemplate(text, templateName) {
    const templates = {
      default: {
        header: '',
        footer: '\n\n---\n\nEste documento es confidencial y para uso exclusivo del paciente.'
      },
      educational: {
        header: '# Material Educativo\n\n',
        footer: '\n\n---\n\nPara más información, consulte con su profesional de salud.'
      },
      worksheet: {
        header: '# Hoja de Trabajo\n\n**Fecha:** {{fechaHoy}}\n**Paciente:** {{nombrePaciente}}\n\n---\n\n',
        footer: '\n\n---\n\n**Notas adicionales:**\n\n_________________________________\n\n_________________________________'
      },
      instructions: {
        header: '# Instrucciones\n\n',
        footer: '\n\n---\n\n**Importante:** Siga estas instrucciones cuidadosamente. Si tiene dudas, contacte a su profesional de salud.'
      }
    };
    
    const template = templates[templateName] || templates.default;
    
    return template.header + text + template.footer;
  }

  /**
   * Add header to PDF with branding
   */
  addPDFHeader(doc, branding, variables) {
    // Add clinic logo if available
    if (branding.logoPath && variables.logoUrl) {
      try {
        // In a real implementation, download and add the logo
        // doc.image(logoPath, 50, 30, { width: 100 });
      } catch (error) {
        console.warn('Could not add logo to PDF:', error);
      }
    }

    // Add clinic name
    if (variables.nombreClinica) {
      doc.fontSize(16)
         .fillColor(branding.primaryColor)
         .text(variables.nombreClinica, 50, 40, { align: 'left' });
    }

    // Add date
    doc.fontSize(10)
       .fillColor(branding.secondaryColor)
       .text(variables.fechaActual || new Date().toLocaleDateString('es-MX'), 50, 65, { align: 'right' });

    // Add line separator
    doc.moveTo(50, 85)
       .lineTo(545, 85)
       .strokeColor(branding.primaryColor)
       .stroke();
  }

  /**
   * Add main content to PDF
   */
  addPDFContent(doc, content, branding) {
    // Start content below header
    let yPosition = 110;

    // Split content into paragraphs
    const paragraphs = content.split('\n\n');

    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        // Handle markdown-style headers
        if (paragraph.startsWith('# ')) {
          doc.fontSize(18)
             .fillColor(branding.primaryColor)
             .text(paragraph.substring(2), 50, yPosition, { align: 'left' });
          yPosition += 30;
        } else if (paragraph.startsWith('## ')) {
          doc.fontSize(14)
             .fillColor(branding.primaryColor)
             .text(paragraph.substring(3), 50, yPosition, { align: 'left' });
          yPosition += 25;
        } else if (paragraph.startsWith('### ')) {
          doc.fontSize(12)
             .fillColor(branding.primaryColor)
             .text(paragraph.substring(4), 50, yPosition, { align: 'left' });
          yPosition += 20;
        } else {
          // Regular paragraph
          doc.fontSize(branding.fontSize)
             .fillColor('#000000')
             .text(paragraph, 50, yPosition, {
               width: 495,
               align: 'left',
               lineGap: 3
             });
          yPosition += doc.heightOfString(paragraph, { width: 495 }) + 15;
        }

        // Check if we need a new page
        if (yPosition > 750) {
          doc.addPage();
          yPosition = 50;
        }
      }
    });
  }

  /**
   * Add footer to PDF
   */
  addPDFFooter(doc, branding, variables) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Add page number
      doc.fontSize(8)
         .fillColor(branding.secondaryColor)
         .text(`Página ${i + 1} de ${pageCount}`, 50, 770, { align: 'center' });

      // Add professional name if available
      if (variables.nombreProfesional) {
        doc.text(`${variables.nombreProfesional}`, 50, 785, { align: 'right' });
      }
    }
  }

  /**
   * Basic variable replacement fallback
   */
  basicVariableReplacement(text, variables) {
    let result = text;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, variables[key] || `{${key}}`);
    });

    return result;
  }

  /**
   * Register custom Handlebars helpers
   */
  registerCustomHelpers() {
    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date, format) => {
      if (!date) return '';
      
      const d = new Date(date);
      
      switch (format) {
        case 'short':
          return d.toLocaleDateString('es-MX');
        case 'long':
          return d.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        case 'time':
          return d.toLocaleTimeString('es-MX');
        default:
          return d.toLocaleDateString('es-MX');
      }
    });

    // Uppercase helper
    this.handlebars.registerHelper('upper', (str) => {
      return str ? str.toString().toUpperCase() : '';
    });

    // Lowercase helper
    this.handlebars.registerHelper('lower', (str) => {
      return str ? str.toString().toLowerCase() : '';
    });

    // Capitalize helper
    this.handlebars.registerHelper('capitalize', (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Default value helper
    this.handlebars.registerHelper('default', (value, defaultValue) => {
      return value || defaultValue || '';
    });

    // Conditional content helper
    this.handlebars.registerHelper('ifExists', (value, options) => {
      if (value && value.trim() !== '') {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });
  }

  /**
   * Validate personalization variables
   */
  validateVariables(variables, requiredVars = []) {
    const missing = [];
    
    requiredVars.forEach(varName => {
      if (!variables[varName] || variables[varName].trim() === '') {
        missing.push(varName);
      }
    });

    return {
      isValid: missing.length === 0,
      missingVariables: missing
    };
  }

  /**
   * Extract variables from template text
   */
  extractVariables(templateText) {
    const variableRegex = /{([^}]+)}/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(templateText)) !== null) {
      const varName = match[1].trim();
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }

    return variables;
  }

  /**
   * Generate preview of personalized content (first 500 chars)
   */
  async generatePreview(templateText, variables = {}) {
    try {
      const personalizedText = await this.personalizeText(templateText, variables);
      
      // Remove markdown formatting for preview
      const cleanText = personalizedText
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links

      return {
        preview: cleanText.substring(0, 500) + (cleanText.length > 500 ? '...' : ''),
        fullLength: personalizedText.length,
        variablesUsed: Object.keys(variables).length,
        extractedVariables: this.extractVariables(templateText)
      };

    } catch (error) {
      console.error('Error generating preview:', error);
      return {
        preview: templateText.substring(0, 500) + '...',
        fullLength: templateText.length,
        variablesUsed: 0,
        extractedVariables: [],
        error: error.message
      };
    }
  }

  /**
   * Get branding configuration for clinic
   */
  async getClinicBranding(clinicId) {
    try {
      // In a real implementation, fetch from database
      // For now, return default branding
      return {
        logoUrl: null,
        primaryColor: '#2196F3',
        secondaryColor: '#666666',
        fontFamily: 'Arial',
        fontSize: 12,
        letterhead: {
          address: '',
          phone: '',
          email: '',
          website: ''
        }
      };
    } catch (error) {
      console.error('Error getting clinic branding:', error);
      return this.config.defaultBranding;
    }
  }
}

module.exports = PersonalizationService;