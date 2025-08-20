/**
 * Watermark Service
 * Handles applying watermarks to PDFs and images
 */

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { executeQuery } = require('../../shared/config/prisma');

class WatermarkService {
  constructor() {
    this.processedPath = path.join(__dirname, '../../../storage/resources/processed');
  }

  /**
   * Apply watermark to a resource based on file type
   */
  async applyWatermark(resourcePath, resourceId, mimeType, watermarkTemplateId, userId) {
    try {
      // Get watermark template
      const template = await this.getWatermarkTemplate(watermarkTemplateId, userId);
      if (!template) {
        throw new Error('Plantilla de marca de agua no encontrada');
      }

      let outputPath;

      if (mimeType === 'application/pdf') {
        outputPath = await this.watermarkPDF(resourcePath, resourceId, template);
      } else if (mimeType.startsWith('image/')) {
        outputPath = await this.watermarkImage(resourcePath, resourceId, template);
      } else {
        // For other document types, convert to PDF first then watermark
        outputPath = await this.watermarkDocument(resourcePath, resourceId, template);
      }

      return outputPath;
    } catch (error) {
      console.error('Error applying watermark:', error);
      throw error;
    }
  }

  /**
   * Apply watermark to PDF
   */
  async watermarkPDF(pdfPath, resourceId, template) {
    try {
      const existingPdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      
      // Prepare watermark text
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = template.font_size || 12;
      const opacity = template.opacity || 0.5;
      
      // For public library resources, always add MindHub watermark
      let watermarkText = template.text_content || '';
      if (template.user_id === 'system') {
        watermarkText = 'Hecho y distribuido por MindHub. Derechos reservados';
      }

      // Calculate position
      const position = this.calculatePosition(template.position);

      // Apply watermark to each page
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        
        let x, y;
        switch (position.horizontal) {
          case 'left':
            x = 50;
            break;
          case 'center':
            x = (width - textWidth) / 2;
            break;
          case 'right':
            x = width - textWidth - 50;
            break;
        }

        switch (position.vertical) {
          case 'top':
            y = height - 50;
            break;
          case 'center':
            y = height / 2;
            break;
          case 'bottom':
            y = 50;
            break;
        }

        page.drawText(watermarkText, {
          x: x,
          y: y,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
          opacity: opacity
        });

        // If template has logo, add it
        if (template.logo_path) {
          try {
            const logoBytes = await fs.readFile(template.logo_path);
            const logoImage = await pdfDoc.embedPng(logoBytes); // or embedJpg
            const logoDims = logoImage.scale(0.25); // Scale logo
            
            page.drawImage(logoImage, {
              x: x,
              y: y + fontSize + 5,
              width: logoDims.width,
              height: logoDims.height,
              opacity: opacity
            });
          } catch (logoError) {
            console.error('Error embedding logo:', logoError);
          }
        }
      }

      // Save the watermarked PDF
      const pdfBytes = await pdfDoc.save();
      const outputPath = path.join(this.processedPath, `${resourceId}_watermarked.pdf`);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, pdfBytes);

      return outputPath;
    } catch (error) {
      console.error('Error watermarking PDF:', error);
      throw error;
    }
  }

  /**
   * Apply watermark to image
   */
  async watermarkImage(imagePath, resourceId, template) {
    try {
      const outputPath = path.join(this.processedPath, `${resourceId}_watermarked.jpg`);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Create watermark text as SVG
      const watermarkText = template.text_content || 'MindHub';
      const fontSize = template.font_size || 24;
      const opacity = template.opacity || 0.5;

      // Get image metadata
      const metadata = await sharp(imagePath).metadata();
      const { width, height } = metadata;

      // Calculate position
      const position = this.calculatePosition(template.position);
      let x, y;

      switch (position.horizontal) {
        case 'left':
          x = 50;
          break;
        case 'center':
          x = width / 2;
          break;
        case 'right':
          x = width - 50;
          break;
      }

      switch (position.vertical) {
        case 'top':
          y = 50;
          break;
        case 'center':
          y = height / 2;
          break;
        case 'bottom':
          y = height - 50;
          break;
      }

      // Create SVG watermark
      const svgText = `
        <svg width="${width}" height="${height}">
          <text x="${x}" y="${y}" 
                font-family="Arial" 
                font-size="${fontSize}" 
                fill="black" 
                opacity="${opacity}"
                text-anchor="middle">
            ${watermarkText}
          </text>
        </svg>
      `;

      // Apply watermark
      await sharp(imagePath)
        .composite([
          {
            input: Buffer.from(svgText),
            gravity: 'center'
          }
        ])
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Error watermarking image:', error);
      throw error;
    }
  }

  /**
   * Apply watermark to other document types
   */
  async watermarkDocument(docPath, resourceId, template) {
    // This would first convert the document to PDF
    // then apply watermark
    // For now, return original path
    return docPath;
  }

  /**
   * Get watermark template
   */
  async getWatermarkTemplate(templateId, userId) {
    try {
      let results;
      
      if (templateId) {
        // Get specific template
        results = await executeQuery(
          async (prisma) => {
            return await prisma.$queryRaw`
              SELECT * FROM watermark_templates 
              WHERE id = ${templateId} 
              AND (user_id = ${userId} OR user_id = 'system')
            `;
          },
          'getWatermarkTemplate'
        );
      } else {
        // Get default template for user
        results = await executeQuery(
          async (prisma) => {
            return await prisma.$queryRaw`
              SELECT * FROM watermark_templates 
              WHERE user_id = ${userId} 
              AND is_default = 1
              LIMIT 1
            `;
          },
          'getDefaultWatermarkTemplate'
        );

        // If no user default, get system default
        if (results.length === 0) {
          results = await executeQuery(
            async (prisma) => {
              return await prisma.$queryRaw`
                SELECT * FROM watermark_templates 
                WHERE user_id = 'system' 
                AND is_default = 1
                LIMIT 1
              `;
            },
            'getSystemWatermarkTemplate'
          );
        }
      }

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting watermark template:', error);
      return null;
    }
  }

  /**
   * Calculate position coordinates
   */
  calculatePosition(positionString) {
    const positions = {
      'top-left': { horizontal: 'left', vertical: 'top' },
      'top-center': { horizontal: 'center', vertical: 'top' },
      'top-right': { horizontal: 'right', vertical: 'top' },
      'center': { horizontal: 'center', vertical: 'center' },
      'bottom-left': { horizontal: 'left', vertical: 'bottom' },
      'bottom-center': { horizontal: 'center', vertical: 'bottom' },
      'bottom-right': { horizontal: 'right', vertical: 'bottom' }
    };

    return positions[positionString] || positions['bottom-right'];
  }

  /**
   * Generate watermarked email attachment
   */
  async generateEmailAttachment(resourceId, template) {
    // This would create a watermarked version specifically for email
    // with potentially different settings
    const outputPath = path.join(this.processedPath, `${resourceId}_email.pdf`);
    // Implementation here
    return outputPath;
  }
}

module.exports = WatermarkService;