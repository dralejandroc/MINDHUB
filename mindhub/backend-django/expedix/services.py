"""
Expedix Services - Business Logic and External Integrations
PDF generation, email services, and other business logic
"""

import io
import base64
from datetime import datetime, timedelta
from django.conf import settings
from django.template.loader import get_template
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
import qrcode


class PrescriptionPDFService:
    """
    Service for generating medical prescription PDFs
    Compliant with Mexican medical prescription standards
    """
    
    def __init__(self):
        self.page_size = A4
        self.margin = 0.75 * inch
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom styles for prescription PDF"""
        # Header style
        self.header_style = ParagraphStyle(
            'CustomHeader',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        # Professional info style
        self.professional_style = ParagraphStyle(
            'Professional',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=10,
            alignment=TA_LEFT,
            textColor=colors.black
        )
        
        # Patient info style
        self.patient_style = ParagraphStyle(
            'Patient',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=10,
            alignment=TA_LEFT,
            backgroundColor=colors.lightgrey
        )
        
        # Prescription style
        self.prescription_style = ParagraphStyle(
            'Prescription',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=8,
            alignment=TA_LEFT,
            leftIndent=20
        )
        
        # Footer style
        self.footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=9,
            alignment=TA_CENTER,
            textColor=colors.grey
        )

    def generate_prescription_pdf(self, prescription):
        """
        Generate PDF for a prescription
        Returns dict with pdf_data and metadata
        """
        try:
            # Create PDF buffer
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=self.page_size,
                rightMargin=self.margin,
                leftMargin=self.margin,
                topMargin=self.margin,
                bottomMargin=self.margin
            )
            
            # Build PDF content
            story = []
            
            # Add header
            story.extend(self._add_header(prescription))
            
            # Add professional information
            story.extend(self._add_professional_info(prescription))
            
            # Add patient information
            story.extend(self._add_patient_info(prescription))
            
            # Add prescription details
            story.extend(self._add_prescription_details(prescription))
            
            # Add medications
            story.extend(self._add_medications(prescription))
            
            # Add instructions and notes
            story.extend(self._add_instructions(prescription))
            
            # Add verification and footer
            story.extend(self._add_verification_footer(prescription))
            
            # Build PDF
            doc.build(story)
            
            # Get PDF data
            pdf_data = buffer.getvalue()
            buffer.close()
            
            # Encode as base64 for storage/transmission
            pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
            
            return {
                'pdf_data': pdf_base64,
                'pdf_size': len(pdf_data),
                'pdf_url': self._save_pdf_file(prescription, pdf_data),
                'generated_at': timezone.now().isoformat(),
                'prescription_number': prescription.prescription_number
            }
            
        except Exception as e:
            raise Exception(f"Error generating prescription PDF: {str(e)}")

    def _add_header(self, prescription):
        """Add prescription header"""
        story = []
        
        # Main header
        header_text = "PRESCRIPCIÓN MÉDICA"
        story.append(Paragraph(header_text, self.header_style))
        story.append(Spacer(1, 20))
        
        # Prescription info table
        prescription_data = [
            ['No. Prescripción:', prescription.prescription_number],
            ['Fecha:', prescription.date_prescribed.strftime('%d/%m/%Y %H:%M')],
            ['Válida hasta:', prescription.valid_until.strftime('%d/%m/%Y') if prescription.valid_until else 'No especificada'],
            ['Tipo:', prescription.get_prescription_type_display()],
        ]
        
        prescription_table = Table(prescription_data, colWidths=[2*inch, 3*inch])
        prescription_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(prescription_table)
        story.append(Spacer(1, 20))
        
        return story

    def _add_professional_info(self, prescription):
        """Add professional information"""
        story = []
        
        professional_text = f"""
        <b>MÉDICO PRESCRIPTOR</b><br/>
        Nombre: {prescription.professional_name or 'No especificado'}<br/>
        Cédula Profesional: {prescription.professional_license or 'No especificada'}<br/>
        Especialidad: {prescription.professional_specialty or 'Medicina General'}
        """
        
        story.append(Paragraph(professional_text, self.professional_style))
        story.append(Spacer(1, 15))
        
        return story

    def _add_patient_info(self, prescription):
        """Add patient information"""
        story = []
        
        # Get patient info (this would be fetched from Supabase in real implementation)
        patient_info = prescription.get_patient_info()
        
        patient_text = f"""
        <b>DATOS DEL PACIENTE</b><br/>
        Nombre: {patient_info.get('full_name', 'No especificado')}<br/>
        ID Paciente: {prescription.patient_id}<br/>
        Email: {patient_info.get('email', 'No especificado')}<br/>
        Teléfono: {patient_info.get('phone', 'No especificado')}
        """
        
        story.append(Paragraph(patient_text, self.patient_style))
        story.append(Spacer(1, 15))
        
        return story

    def _add_prescription_details(self, prescription):
        """Add prescription diagnosis and clinical details"""
        story = []
        
        # Diagnosis
        diagnosis_text = f"<b>DIAGNÓSTICO:</b><br/>{prescription.diagnosis}"
        story.append(Paragraph(diagnosis_text, self.prescription_style))
        story.append(Spacer(1, 10))
        
        # Clinical notes if available
        if prescription.clinical_notes:
            notes_text = f"<b>NOTAS CLÍNICAS:</b><br/>{prescription.clinical_notes}"
            story.append(Paragraph(notes_text, self.prescription_style))
            story.append(Spacer(1, 10))
            
        return story

    def _add_medications(self, prescription):
        """Add medications table"""
        story = []
        
        story.append(Paragraph("<b>MEDICAMENTOS PRESCRITOS</b>", self.prescription_style))
        story.append(Spacer(1, 10))
        
        if not prescription.medications:
            story.append(Paragraph("No se especificaron medicamentos", self.prescription_style))
            return story
        
        # Create medications table
        med_data = [['No.', 'Medicamento', 'Dosis', 'Frecuencia', 'Duración', 'Indicaciones']]
        
        for i, med in enumerate(prescription.medications, 1):
            med_data.append([
                str(i),
                med.get('name', 'No especificado'),
                med.get('dosage', 'No especificada'),
                med.get('frequency', 'No especificada'),
                med.get('duration', 'No especificada'),
                med.get('instructions', 'Según indicación médica')
            ])
        
        med_table = Table(med_data, colWidths=[0.5*inch, 1.5*inch, 1*inch, 1*inch, 1*inch, 1.5*inch])
        med_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(med_table)
        story.append(Spacer(1, 15))
        
        return story

    def _add_instructions(self, prescription):
        """Add general instructions and follow-up info"""
        story = []
        
        if prescription.general_instructions:
            instructions_text = f"<b>INSTRUCCIONES GENERALES:</b><br/>{prescription.general_instructions}"
            story.append(Paragraph(instructions_text, self.prescription_style))
            story.append(Spacer(1, 10))
        
        if prescription.follow_up_date:
            followup_text = f"<b>PRÓXIMA CITA:</b> {prescription.follow_up_date.strftime('%d/%m/%Y')}"
            story.append(Paragraph(followup_text, self.prescription_style))
            story.append(Spacer(1, 10))
        
        if prescription.follow_up_notes:
            followup_notes_text = f"<b>INDICACIONES DE SEGUIMIENTO:</b><br/>{prescription.follow_up_notes}"
            story.append(Paragraph(followup_notes_text, self.prescription_style))
            story.append(Spacer(1, 10))
        
        return story

    def _add_verification_footer(self, prescription):
        """Add verification QR code and footer"""
        story = []
        
        story.append(Spacer(1, 30))
        
        # Generate QR code for verification
        if prescription.verification_code:
            try:
                qr_data = self._generate_qr_code(prescription)
                if qr_data:
                    story.append(qr_data)
                    story.append(Spacer(1, 10))
            except:
                pass  # Continue without QR if generation fails
        
        # Verification info
        verification_text = f"""
        <b>CÓDIGO DE VERIFICACIÓN:</b> {prescription.verification_code or 'No generado'}<br/>
        <b>FECHA DE GENERACIÓN:</b> {timezone.now().strftime('%d/%m/%Y %H:%M')}<br/>
        <b>VÁLIDA HASTA:</b> {prescription.valid_until.strftime('%d/%m/%Y') if prescription.valid_until else 'Sin límite'}
        """
        story.append(Paragraph(verification_text, self.footer_style))
        
        # Legal footer
        legal_text = """
        Esta prescripción médica es válida únicamente con el código de verificación.
        Para verificar la autenticidad de esta prescripción, visite: https://mindhub.cloud/verify
        """
        story.append(Spacer(1, 10))
        story.append(Paragraph(legal_text, self.footer_style))
        
        return story

    def _generate_qr_code(self, prescription):
        """Generate QR code for prescription verification"""
        try:
            qr_text = f"PRESCRIPTION:{prescription.prescription_number}:CODE:{prescription.verification_code}:VERIFY:https://mindhub.cloud/verify/{prescription.prescription_number}"
            
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_text)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to ReportLab Image
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            # Create ReportLab Image object
            qr_image = Image(img_buffer, width=1*inch, height=1*inch)
            
            return qr_image
            
        except Exception as e:
            print(f"Error generating QR code: {e}")
            return None

    def _save_pdf_file(self, prescription, pdf_data):
        """Save PDF file and return URL (placeholder implementation)"""
        try:
            # In a real implementation, this would save to cloud storage
            # For now, return a placeholder URL
            filename = f"prescription_{prescription.prescription_number}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # This would be implemented with actual file storage
            # For now, return a mock URL
            return f"https://mindhub.cloud/prescriptions/pdf/{filename}"
            
        except Exception as e:
            print(f"Error saving PDF file: {e}")
            return None


class PatientDataService:
    """
    Service for fetching patient data from Supabase
    This would contain the actual implementation for getting patient info
    """
    
    @staticmethod
    def get_patient_by_id(patient_id):
        """Fetch patient data from Supabase"""
        # This would be implemented with actual Supabase queries
        # For now, return mock data
        return {
            'patient_id': patient_id,
            'full_name': 'Paciente Ejemplo',
            'email': 'paciente@ejemplo.com',
            'phone': '555-0123',
            'date_of_birth': '1990-01-01',
            'gender': 'No especificado'
        }


class EmailService:
    """
    Service for sending prescription emails to patients
    """
    
    @staticmethod
    def send_prescription_email(prescription, pdf_data):
        """Send prescription PDF to patient via email"""
        # This would be implemented with actual email service
        # For now, return success status
        return {
            'success': True,
            'message': 'Prescription sent successfully'
        }