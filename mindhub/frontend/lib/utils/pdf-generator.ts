'use client';

/**
 * PDF Generator for ClinimetrixPro Assessment Reports
 * Generates professional PDF reports from assessment results
 */

interface AssessmentPDFData {
  scaleName: string;
  scaleAbbreviation: string;
  patientName: string;
  patientAge?: number;
  date: string;
  totalScore: number;
  maxPossibleScore: number;
  severityLevel: string;
  interpretation?: {
    description?: string;
    clinicalInterpretation?: string;
    professionalRecommendations?: string[];
    prognosticImplications?: string;
    color?: string;
  };
  subscaleScores?: Array<{
    name: string;
    score: number;
    severity: string;
  }>;
  completionTime: number;
  templateData?: any;
}

class ClinimetrixPDFGenerator {
  
  /**
   * Generate PDF report from assessment results
   */
  async generateAssessmentPDF(data: AssessmentPDFData): Promise<void> {
    try {
      // Try to use jsPDF if available
      const { jsPDF } = await this.loadJsPDF();
      
      const doc = new jsPDF();
      
      // Set up document styling
      this.setupDocumentStyles(doc);
      
      // Generate content
      this.addHeader(doc, data);
      this.addPatientInfo(doc, data);
      this.addResults(doc, data);
      this.addInterpretation(doc, data);
      this.addSubscaleScores(doc, data);
      this.addFooter(doc, data);
      
      // Save the PDF
      const fileName = `${data.scaleAbbreviation}_${data.patientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback: Create HTML content and trigger print
      this.fallbackToPrintableHTML(data);
    }
  }

  /**
   * Load jsPDF library dynamically
   */
  private async loadJsPDF(): Promise<any> {
    try {
      // Try to import jsPDF
      const jsPDFModule = await import('jspdf');
      return jsPDFModule;
    } catch (error) {
      console.warn('jsPDF not available, falling back to HTML print');
      throw new Error('jsPDF not available');
    }
  }

  /**
   * Setup document styles
   */
  private setupDocumentStyles(doc: any): void {
    // Set default font
    doc.setFont('helvetica');
  }

  /**
   * Add header to PDF
   */
  private addHeader(doc: any, data: AssessmentPDFData): void {
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('INFORME DE EVALUACIÓN CLÍNICA', 20, 30);
    
    // Scale name
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text(data.scaleName, 20, 45);
    
    // Abbreviation and date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${data.scaleAbbreviation} • ${data.date}`, 20, 55);
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 65, 190, 65);
  }

  /**
   * Add patient information
   */
  private addPatientInfo(doc: any, data: AssessmentPDFData): void {
    let y = 80;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('INFORMACIÓN DEL PACIENTE', 20, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Nombre: ${data.patientName}`, 20, y);
    
    if (data.patientAge) {
      y += 10;
      doc.text(`Edad: ${data.patientAge} años`, 20, y);
    }
    
    y += 10;
    const durationMinutes = Math.floor(data.completionTime / 60000);
    const durationSeconds = Math.floor((data.completionTime % 60000) / 1000);
    doc.text(`Duración de la evaluación: ${durationMinutes} min ${durationSeconds} seg`, 20, y);
  }

  /**
   * Add results section
   */
  private addResults(doc: any, data: AssessmentPDFData): void {
    let y = 130;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('RESULTADOS', 20, y);
    
    y += 20;
    
    // Score box
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y, 170, 30, 'F');
    
    // Total score
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`Puntuación Total: ${data.totalScore}/${data.maxPossibleScore}`, 25, y + 12);
    
    // Severity level
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(`Nivel de Severidad: ${data.severityLevel}`, 25, y + 25);
  }

  /**
   * Add interpretation section
   */
  private addInterpretation(doc: any, data: AssessmentPDFData): void {
    if (!data.interpretation) return;
    
    let y = 180;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('INTERPRETACIÓN CLÍNICA', 20, y);
    
    y += 15;
    
    if (data.interpretation.description) {
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(data.interpretation.description, 170);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 10;
    }
    
    if (data.interpretation.clinicalInterpretation) {
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('Interpretación Clínica:', 20, y);
      y += 8;
      
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(data.interpretation.clinicalInterpretation, 170);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 10;
    }
    
    if (data.interpretation.professionalRecommendations && data.interpretation.professionalRecommendations.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('Recomendaciones Profesionales:', 20, y);
      y += 10;
      
      data.interpretation.professionalRecommendations.forEach(rec => {
        doc.setTextColor(60, 60, 60);
        doc.text(`• ${rec}`, 25, y);
        y += 8;
      });
    }
  }

  /**
   * Add subscale scores
   */
  private addSubscaleScores(doc: any, data: AssessmentPDFData): void {
    if (!data.subscaleScores || data.subscaleScores.length === 0) return;
    
    let y = doc.internal.pageSize.height - 80; // Start from bottom
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('PUNTUACIONES POR SUBESCALA', 20, y);
    
    y += 15;
    
    data.subscaleScores.forEach(subscale => {
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`${subscale.name}: ${subscale.score} (${subscale.severity})`, 20, y);
      y += 8;
    });
  }

  /**
   * Add footer
   */
  private addFooter(doc: any, data: AssessmentPDFData): void {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado por ClinimetrixPro - MindHub Healthcare Platform', 20, pageHeight - 20);
    doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, 20, pageHeight - 10);
  }

  /**
   * Fallback to printable HTML when PDF generation fails
   */
  private fallbackToPrintableHTML(data: AssessmentPDFData): void {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes e intenta de nuevo.');
      return;
    }
    
    const htmlContent = this.generatePrintableHTML(data);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog after content loads
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  /**
   * Generate printable HTML content
   */
  private generatePrintableHTML(data: AssessmentPDFData): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte - ${data.scaleName}</title>
        <style>
            @media print {
                @page { margin: 20mm; size: A4; }
                body { margin: 0; }
            }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2d3748;
                margin-bottom: 10px;
                font-size: 24px;
            }
            .header h2 {
                color: #4a5568;
                margin-bottom: 5px;
                font-size: 18px;
            }
            .section {
                margin-bottom: 25px;
            }
            .section h3 {
                color: #2d3748;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }
            .results-box {
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 15px 0;
                text-align: center;
            }
            .score {
                font-size: 24px;
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 10px;
            }
            .severity {
                font-size: 16px;
                color: #4a5568;
                padding: 8px 16px;
                background: white;
                border-radius: 20px;
                display: inline-block;
            }
            .recommendations {
                background: #f0fff4;
                border-left: 4px solid #48bb78;
                padding: 15px;
                margin: 15px 0;
            }
            .recommendations ul {
                margin: 10px 0;
                padding-left: 20px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                color: #718096;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>INFORME DE EVALUACIÓN CLÍNICA</h1>
            <h2>${data.scaleName}</h2>
            <p>${data.scaleAbbreviation} • ${data.date}</p>
        </div>

        <div class="section">
            <h3>INFORMACIÓN DEL PACIENTE</h3>
            <p><strong>Nombre:</strong> ${data.patientName}</p>
            ${data.patientAge ? `<p><strong>Edad:</strong> ${data.patientAge} años</p>` : ''}
            <p><strong>Duración:</strong> ${Math.floor(data.completionTime / 60000)} min ${Math.floor((data.completionTime % 60000) / 1000)} seg</p>
        </div>

        <div class="section">
            <h3>RESULTADOS</h3>
            <div class="results-box">
                <div class="score">${data.totalScore}/${data.maxPossibleScore} puntos</div>
                <div class="severity">${data.severityLevel}</div>
            </div>
        </div>

        ${data.interpretation ? `
        <div class="section">
            <h3>INTERPRETACIÓN CLÍNICA</h3>
            ${data.interpretation.description ? `<p>${data.interpretation.description}</p>` : ''}
            ${data.interpretation.clinicalInterpretation ? `<p><strong>Interpretación:</strong> ${data.interpretation.clinicalInterpretation}</p>` : ''}
            ${data.interpretation.professionalRecommendations && data.interpretation.professionalRecommendations.length > 0 ? `
                <div class="recommendations">
                    <h4>Recomendaciones Profesionales:</h4>
                    <ul>
                        ${data.interpretation.professionalRecommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
        ` : ''}

        ${data.subscaleScores && data.subscaleScores.length > 0 ? `
        <div class="section">
            <h3>PUNTUACIONES POR SUBESCALA</h3>
            ${data.subscaleScores.map(sub => `
                <p><strong>${sub.name}:</strong> ${sub.score} (${sub.severity})</p>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>Generado por ClinimetrixPro - MindHub Healthcare Platform</p>
            <p>Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Simple print function for existing content
   */
  async printResults(): Promise<void> {
    try {
      window.print();
    } catch (error) {
      console.error('Error printing:', error);
      alert('Error al imprimir. Por favor, intenta usar Ctrl+P manualmente.');
    }
  }
}

// Export singleton instance
export const clinimetrixPDFGenerator = new ClinimetrixPDFGenerator();
export default clinimetrixPDFGenerator;