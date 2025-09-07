'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  EyeIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface PrescriptionTemplate {
  id: string;
  name: string;
  header: {
    text: string;
    fontSize: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
    includeDate: boolean;
    includeLogo: boolean;
    logoPosition: 'left' | 'right';
  };
  doctor: {
    includeName: boolean;
    includeSpecialty: boolean;
    includeLicense: boolean;
    includeSignature: boolean;
    signaturePosition: 'left' | 'center' | 'right';
  };
  clinic: {
    includeName: boolean;
    includeAddress: boolean;
    includePhone: boolean;
    includeEmail: boolean;
  };
  patient: {
    includeBirthDate: boolean; // OBLIGATORIO siempre
    includeAge: boolean; // OBLIGATORIO siempre
    includeWeight: boolean;
    includeAllergies: boolean;
    fontSize: number;
  };
  medications: {
    fontSize: number;
    includeInstructions: boolean;
    numbering: 'arabic' | 'roman' | 'bullets';
    spacing: number;
  };
  footer: {
    text: string;
    fontSize: number;
    color: string;
    includeDate: boolean;
    includeValidityPeriod: boolean;
  };
  layout: {
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    paperSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
}

interface PrescriptionDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (template: PrescriptionTemplate) => void;
  currentTemplate?: PrescriptionTemplate;
  sampleData?: {
    doctor: any;
    patient: any;
    medications: any[];
    clinic: any;
  };
  prescriptionSettings?: {
    prescriptionType: 'printed' | 'digital' | 'both';
    includeFields: any;
    digitalPrescriptionSettings?: any;
  };
}

const DEFAULT_TEMPLATE: PrescriptionTemplate = {
  id: '',
  name: 'Plantilla Por Defecto',
  header: {
    text: 'PRESCRIPCIÓN MÉDICA',
    fontSize: 20,
    color: '#1f2937',
    alignment: 'center',
    includeDate: true,
    includeLogo: false,
    logoPosition: 'left'
  },
  doctor: {
    includeName: true,
    includeSpecialty: true,
    includeLicense: true,
    includeSignature: true,
    signaturePosition: 'right'
  },
  clinic: {
    includeName: true,
    includeAddress: true,
    includePhone: true,
    includeEmail: false
  },
  patient: {
    includeBirthDate: true, // OBLIGATORIO - siempre incluido
    includeAge: true, // OBLIGATORIO - siempre incluido
    includeWeight: false,
    includeAllergies: true,
    fontSize: 12
  },
  medications: {
    fontSize: 14,
    includeInstructions: true,
    numbering: 'arabic',
    spacing: 8
  },
  footer: {
    text: 'Esta receta es válida por 30 días a partir de su fecha de emisión.',
    fontSize: 10,
    color: '#6b7280',
    includeDate: true,
    includeValidityPeriod: true
  },
  layout: {
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    },
    paperSize: 'A4',
    orientation: 'portrait',
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1
  },
  colors: {
    primary: '#0d9488',
    secondary: '#14b8a6',
    text: '#1f2937',
    accent: '#f59e0b'
  }
};

export function PrescriptionDesigner({ 
  isOpen, 
  onClose, 
  onSaveTemplate, 
  currentTemplate,
  sampleData,
  prescriptionSettings 
}: PrescriptionDesignerProps) {
  const [template, setTemplate] = useState<PrescriptionTemplate>(
    currentTemplate || { ...DEFAULT_TEMPLATE, id: Date.now().toString() }
  );
  const [activeTab, setActiveTab] = useState<'design' | 'preview' | 'layout'>('design');
  const [selectedPrescriptionType, setSelectedPrescriptionType] = useState<'printed' | 'digital'>(
    prescriptionSettings?.prescriptionType === 'both' ? 'printed' : (prescriptionSettings?.prescriptionType || 'printed')
  );
  const previewRef = useRef<HTMLDivElement>(null);

  const updateTemplate = (section: keyof PrescriptionTemplate, updates: any) => {
    setTemplate(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), ...updates }
    }));
  };

  const generatePreviewHTML = () => {
    const mockData = sampleData || {
      doctor: {
        first_name: 'Dr. Alejandro',
        last_name: 'Contreras',
        specialty: 'Psiquiatría',
        license: '12345678',
        signature_url: null
      },
      patient: {
        first_name: 'Lorena',
        paternal_last_name: 'Ramos',
        maternal_last_name: 'Galindo',
        age: 35,
        weight: '65 kg',
        allergies: 'Ninguna conocida'
      },
      medications: [
        {
          name: 'AVELOX (Moxifloxacino) 400 mg',
          dosage: 'Vía de administración: Oral',
          frequency: 'Presentación: Tomar una al día por 5 días',
          instructions: 'Tomar con abundante agua'
        },
        {
          name: 'AVAPENA (Clorpromazina) 25 mg', 
          dosage: 'Vía de administración: Oral',
          frequency: 'Presentación: Tomar una cada 12 horas por 5 días',
          instructions: 'Tomar después de los alimentos'
        }
      ],
      clinic: {
        name: 'MindHub Clínica',
        address: 'Av. Revolución 123, Col. Centro, CDMX',
        phone: '+52 55 1234 5678',
        email: 'contacto@mindhub.cloud'
      }
    };

    return `
      <div style="
        max-width: ${template.layout.paperSize === 'A4' ? '210mm' : template.layout.paperSize === 'Letter' ? '216mm' : '216mm'};
        min-height: ${template.layout.paperSize === 'A4' ? '297mm' : template.layout.paperSize === 'Letter' ? '279mm' : '356mm'};
        margin: 0 auto;
        padding: ${template.layout.margins.top}mm ${template.layout.margins.right}mm ${template.layout.margins.bottom}mm ${template.layout.margins.left}mm;
        background: ${template.layout.backgroundColor};
        border: ${template.layout.borderWidth}px solid ${template.layout.borderColor};
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: ${template.colors.text};
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="text-align: ${template.header.alignment}; margin-bottom: 20px; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 10px;">
          <h1 style="
            margin: 0;
            font-size: ${template.header.fontSize}px;
            color: ${template.header.color};
            font-weight: bold;
          ">${template.header.text}</h1>
          ${template.header.includeDate ? `
            <p style="margin: 5px 0; font-size: 12px; color: ${template.colors.secondary};">
              FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-MX')} | 
              FECHA DE VIGENCIA: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX')}
            </p>
          ` : ''}
        </div>

        <!-- Doctor & Clinic Info -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="flex: 1;">
            ${template.doctor.includeName ? `<p style="margin: 2px 0; font-weight: bold;">${mockData.doctor.first_name} ${mockData.doctor.last_name}</p>` : ''}
            ${template.doctor.includeSpecialty ? `<p style="margin: 2px 0; color: ${template.colors.secondary};">Especialidad: ${mockData.doctor.specialty}</p>` : ''}
            ${template.doctor.includeLicense ? `<p style="margin: 2px 0; font-size: 11px;">Cédula Profesional: ${mockData.doctor.license}</p>` : ''}
          </div>
          <div style="flex: 1; text-align: right;">
            ${template.clinic.includeName ? `<p style="margin: 2px 0; font-weight: bold;">${mockData.clinic.name}</p>` : ''}
            ${template.clinic.includeAddress ? `<p style="margin: 2px 0; font-size: 11px;">${mockData.clinic.address}</p>` : ''}
            ${template.clinic.includePhone ? `<p style="margin: 2px 0; font-size: 11px;">Tel: ${mockData.clinic.phone}</p>` : ''}
            ${template.clinic.includeEmail ? `<p style="margin: 2px 0; font-size: 11px;">${mockData.clinic.email}</p>` : ''}
          </div>
        </div>

        <!-- Patient Info -->
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${template.colors.primary};">
          <h3 style="margin: 0 0 10px 0; color: ${template.colors.primary}; font-size: ${template.patient.fontSize + 2}px;">Nombre del paciente</h3>
          <p style="margin: 2px 0; font-size: ${template.patient.fontSize}px; font-weight: bold;">
            ${mockData.patient.first_name} ${mockData.patient.paternal_last_name} ${mockData.patient.maternal_last_name}
          </p>
          <p style="margin: 2px 0; font-size: ${template.patient.fontSize}px;">Fecha de nacimiento: ${new Date(Date.now() - mockData.patient.age * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX')}</p>
          <p style="margin: 2px 0; font-size: ${template.patient.fontSize}px;">Edad: ${mockData.patient.age} años</p>
          ${template.patient.includeWeight && mockData.patient.weight ? `<p style="margin: 2px 0; font-size: ${template.patient.fontSize}px;">Peso: ${mockData.patient.weight}</p>` : ''}
          ${template.patient.includeAllergies ? `<p style="margin: 2px 0; font-size: ${template.patient.fontSize}px;">Alergias: ${mockData.patient.allergies}</p>` : ''}
        </div>

        <!-- Diagnosis Section -->
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: ${template.colors.primary}; font-size: 14px; border-bottom: 1px solid ${template.colors.primary}; padding-bottom: 5px;">Diagnóstico</h3>
          <p style="margin: 0; font-size: 12px;">Intoxicación alimentaria estafislocócica</p>
        </div>

        <!-- Medications -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: ${template.colors.primary}; background: ${template.colors.primary}; color: white; padding: 8px; text-align: center; font-size: 14px;">MEDICAMENTOS</h3>
          <div style="margin-bottom: ${template.medications.spacing}px;">
            ${mockData.medications.map((med, index) => `
              <div style="
                margin-bottom: ${template.medications.spacing}px; 
                border: 1px solid #e5e7eb; 
                padding: 12px; 
                border-radius: 6px;
                background: #fafafa;
              ">
                <div style="display: flex; align-items: flex-start;">
                  <span style="
                    font-weight: bold; 
                    margin-right: 10px; 
                    color: ${template.colors.accent};
                    min-width: 20px;
                  ">
                    ${template.medications.numbering === 'arabic' ? `${index + 1}.` : 
                      template.medications.numbering === 'roman' ? `${['I', 'II', 'III', 'IV', 'V'][index] || (index + 1)}.` :
                      '•'}
                  </span>
                  <div style="flex: 1;">
                    <p style="margin: 0 0 5px 0; font-size: ${template.medications.fontSize}px; font-weight: bold; color: ${template.colors.text};">
                      ${med.name}
                    </p>
                    <table style="width: 100%; border-collapse: collapse; font-size: ${template.medications.fontSize - 2}px;">
                      <tr>
                        <td style="padding: 2px 0; width: 25%; color: ${template.colors.secondary}; font-weight: 500;">Forma farmacéutica</td>
                        <td style="padding: 2px 0; width: 25%; color: ${template.colors.secondary}; font-weight: 500;">${med.dosage}</td>
                        <td style="padding: 2px 0; width: 25%; color: ${template.colors.secondary}; font-weight: 500;">Presentación</td>
                        <td style="padding: 2px 0; width: 25%; color: ${template.colors.secondary}; font-weight: 500;">${med.frequency}</td>
                      </tr>
                      <tr>
                        <td style="padding: 2px 0;">comprimido</td>
                        <td style="padding: 2px 0;">Oral</td>
                        <td style="padding: 2px 0;">Descripción</td>
                        <td style="padding: 2px 0;">Instrucciones</td>
                      </tr>
                    </table>
                    ${template.medications.includeInstructions && med.instructions ? `
                      <p style="margin: 8px 0 0 0; font-size: ${template.medications.fontSize - 1}px; font-style: italic; color: ${template.colors.secondary};">
                        ${med.instructions}
                      </p>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Additional Instructions -->
          <div style="margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13px; color: ${template.colors.primary};">Indicaciones de la receta:</h4>
            <p style="margin: 0; font-size: 12px; line-height: 1.5;">Tomar muchos líquidos, dieta blanda y reposo.</p>
          </div>
        </div>

        <!-- Footer & Signature -->
        <div style="margin-top: 30px; border-top: 1px solid ${template.colors.primary}; padding-top: 15px;">
          ${template.footer.text ? `
            <p style="
              text-align: center; 
              font-size: ${template.footer.fontSize}px; 
              color: ${template.footer.color}; 
              margin: 0 0 20px 0;
              font-style: italic;
            ">
              ${template.footer.text}
            </p>
          ` : ''}
          
          ${template.doctor.includeSignature ? `
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="text-align: left; flex: 1;">
                <p style="margin: 0; font-size: 10px; color: ${template.colors.secondary};">Sello digital</p>
                <p style="margin: 2px 0; font-size: 8px; color: #6b7280; font-family: monospace;">
                  7f837f08849f03f26457c8d4ce0e18883e95b4f96126574f147f38dffe
                </p>
              </div>
              <div style="text-align: ${template.doctor.signaturePosition}; flex: 1;">
                <div style="border-top: 1px solid ${template.colors.text}; padding-top: 5px; margin-top: 40px; display: inline-block; min-width: 200px;">
                  <p style="margin: 0; font-size: 11px; text-align: center;">
                    ${mockData.doctor.first_name} ${mockData.doctor.last_name}
                  </p>
                  <p style="margin: 2px 0 0 0; font-size: 10px; text-align: center; color: ${template.colors.secondary};">
                    Cédula: ${mockData.doctor.license}
                  </p>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${template.footer.includeDate ? `
            <p style="text-align: center; font-size: 9px; color: ${template.colors.secondary}; margin: 15px 0 0 0;">
              Cadena digital: [ID:917]2026-04-24-17:11-28-616-06-00[2020-26-24]16-16-36-15-00[2015&9vacionpacionalimitestafilosócica]DiagnosticMedicamentosPlantil12947-A1-HN427[Lorena]Ramos]Galindo[35 años]AVELOX[Moxifloxacino]comprimido]Oral[400 mg]1x4]8][AVAPENA]Clorpromazina]comprimido]Oral[25 mg]1x8]SERSIBIL]LevatiStafina]comprimido]Oral[10 mg]1x4]B]DAV]L[buprofeno]comprimido]Oral[200 mg]
            </p>
          ` : ''}
        </div>
      </div>
    `;
  };

  const printPreview = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }

    const html = generatePreviewHTML();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vista Previa - Receta MindHub</title>
          <style>
            @page { margin: 0; }
            body { margin: 0; padding: 20px; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  const downloadTemplate = () => {
    const templateData = {
      ...template,
      created_at: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantilla_receta_${template.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Plantilla descargada');
  };

  const saveTemplate = () => {
    if (!template.name.trim()) {
      toast.error('Por favor ingrese un nombre para la plantilla');
      return;
    }
    
    onSaveTemplate(template);
    toast.success('Plantilla guardada exitosamente');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">🎨 Diseñador de Recetas</h2>
            <p className="text-sm text-gray-600">Personaliza el diseño de tus prescripciones médicas</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 h-[calc(95vh-120px)]">
          {/* Left Panel - Controls */}
          <div className="w-1/3 border-r overflow-y-auto p-6 space-y-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Plantilla
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="Mi Plantilla Personalizada"
              />
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {[
                { id: 'design', label: 'Diseño', icon: PaintBrushIcon },
                { id: 'layout', label: 'Layout', icon: Cog6ToothIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Design Tab */}
            {activeTab === 'design' && (
              <div className="space-y-6">
                {/* Prescription Type Selection */}
                {prescriptionSettings?.prescriptionType === 'both' && (
                  <Card className="p-4 border-blue-200 bg-blue-50">
                    <h3 className="text-lg font-medium text-blue-900 mb-3">Tipo de Receta</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="prescriptionType"
                          value="printed"
                          checked={selectedPrescriptionType === 'printed'}
                          onChange={(e) => setSelectedPrescriptionType(e.target.value as 'printed' | 'digital')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-700">Receta Impresa (papel con membrete)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="prescriptionType"
                          value="digital"
                          checked={selectedPrescriptionType === 'digital'}
                          onChange={(e) => setSelectedPrescriptionType(e.target.value as 'printed' | 'digital')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-700">Receta Digital (con código QR y cadena)</span>
                      </label>
                    </div>
                    
                    {selectedPrescriptionType === 'digital' && (
                      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                        <div className="text-sm text-yellow-800">
                          <strong>Campos obligatorios en receta digital:</strong>
                          <ul className="list-disc ml-4 mt-1">
                            <li>Nombre del prescriptor</li>
                            <li>Cédula profesional</li>
                            <li>Especialidad médica</li>
                            <li>Sello digital</li>
                            <li>Código QR con cadena de autenticidad</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
                
                {/* Header Settings */}
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Encabezado</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Texto</label>
                      <input
                        type="text"
                        value={template.header.text}
                        onChange={(e) => updateTemplate('header', { text: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Tamaño</label>
                        <input
                          type="number"
                          value={template.header.fontSize}
                          onChange={(e) => updateTemplate('header', { fontSize: parseInt(e.target.value) })}
                          min="12"
                          max="32"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={template.header.color}
                          onChange={(e) => updateTemplate('header', { color: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Alineación</label>
                      <select
                        value={template.header.alignment}
                        onChange={(e) => updateTemplate('header', { alignment: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="left">Izquierda</option>
                        <option value="center">Centro</option>
                        <option value="right">Derecha</option>
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Colors */}
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Colores del Tema</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Primario</label>
                      <input
                        type="color"
                        value={template.colors.primary}
                        onChange={(e) => updateTemplate('colors', { primary: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Secundario</label>
                      <input
                        type="color"
                        value={template.colors.secondary}
                        onChange={(e) => updateTemplate('colors', { secondary: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Texto</label>
                      <input
                        type="color"
                        value={template.colors.text}
                        onChange={(e) => updateTemplate('colors', { text: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Acento</label>
                      <input
                        type="color"
                        value={template.colors.accent}
                        onChange={(e) => updateTemplate('colors', { accent: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </Card>

                {/* Medications Settings */}
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Medicamentos</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Tamaño de fuente</label>
                        <input
                          type="number"
                          value={template.medications.fontSize}
                          onChange={(e) => updateTemplate('medications', { fontSize: parseInt(e.target.value) })}
                          min="8"
                          max="24"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Espaciado</label>
                        <input
                          type="number"
                          value={template.medications.spacing}
                          onChange={(e) => updateTemplate('medications', { spacing: parseInt(e.target.value) })}
                          min="4"
                          max="20"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Numeración</label>
                      <select
                        value={template.medications.numbering}
                        onChange={(e) => updateTemplate('medications', { numbering: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="arabic">Números (1, 2, 3)</option>
                        <option value="roman">Romanos (I, II, III)</option>
                        <option value="bullets">Viñetas (•)</option>
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Footer Settings */}
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Pie de Página</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Texto</label>
                      <textarea
                        value={template.footer.text}
                        onChange={(e) => updateTemplate('footer', { text: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Tamaño</label>
                        <input
                          type="number"
                          value={template.footer.fontSize}
                          onChange={(e) => updateTemplate('footer', { fontSize: parseInt(e.target.value) })}
                          min="6"
                          max="16"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={template.footer.color}
                          onChange={(e) => updateTemplate('footer', { color: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Layout Tab */}
            {activeTab === 'layout' && (
              <div className="space-y-6">
                {/* Paper Settings */}
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Configuración del Papel</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Tamaño</label>
                      <select
                        value={template.layout.paperSize}
                        onChange={(e) => updateTemplate('layout', { paperSize: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="A4">A4 (210 × 297 mm)</option>
                        <option value="Letter">Carta (216 × 279 mm)</option>
                        <option value="Legal">Oficio (216 × 356 mm)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Orientación</label>
                      <select
                        value={template.layout.orientation}
                        onChange={(e) => updateTemplate('layout', { orientation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="portrait">Vertical</option>
                        <option value="landscape">Horizontal</option>
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Margins */}
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Márgenes (mm)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Superior</label>
                      <input
                        type="number"
                        value={template.layout.margins.top}
                        onChange={(e) => updateTemplate('layout', { 
                          margins: { ...template.layout.margins, top: parseInt(e.target.value) }
                        })}
                        min="5"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Inferior</label>
                      <input
                        type="number"
                        value={template.layout.margins.bottom}
                        onChange={(e) => updateTemplate('layout', { 
                          margins: { ...template.layout.margins, bottom: parseInt(e.target.value) }
                        })}
                        min="5"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Izquierdo</label>
                      <input
                        type="number"
                        value={template.layout.margins.left}
                        onChange={(e) => updateTemplate('layout', { 
                          margins: { ...template.layout.margins, left: parseInt(e.target.value) }
                        })}
                        min="5"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Derecho</label>
                      <input
                        type="number"
                        value={template.layout.margins.right}
                        onChange={(e) => updateTemplate('layout', { 
                          margins: { ...template.layout.margins, right: parseInt(e.target.value) }
                        })}
                        min="5"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </Card>

                {/* Include Options */}
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Elementos a Incluir</h3>
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Doctor</h4>
                    <div className="space-y-2 pl-3">
                      {[
                        { key: 'includeName', label: 'Nombre completo' },
                        { key: 'includeSpecialty', label: 'Especialidad' },
                        { key: 'includeLicense', label: 'Cédula profesional' },
                        { key: 'includeSignature', label: 'Firma y sello' }
                      ].map(option => (
                        <label key={option.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={template.doctor[option.key as keyof typeof template.doctor] as boolean}
                            onChange={(e) => updateTemplate('doctor', { [option.key]: e.target.checked })}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 mt-4">Información del Paciente</h4>
                    
                    {/* Campos Obligatorios */}
                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                      <h5 className="text-xs font-medium text-green-800 mb-2">✓ Campos Obligatorios (siempre incluidos)</h5>
                      <div className="space-y-1 text-xs text-green-700">
                        <div>• Nombre completo del paciente</div>
                        <div>• Fecha de nacimiento</div>
                        <div>• Edad calculada</div>
                      </div>
                    </div>
                    
                    {/* Campos Opcionales */}
                    <h5 className="text-xs font-medium text-gray-600 mb-2">Campos Opcionales</h5>
                    <div className="space-y-2 pl-3">
                      {[
                        { key: 'includeWeight', label: 'Peso del paciente' },
                        { key: 'includeAllergies', label: 'Alergias conocidas' }
                      ].map(option => (
                        <label key={option.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={template.patient[option.key as keyof typeof template.patient] as boolean}
                            onChange={(e) => updateTemplate('patient', { [option.key]: e.target.checked })}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Vista Previa</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={printPreview}>
                    <PrinterIcon className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div 
                ref={previewRef}
                dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }}
                className="mx-auto shadow-lg"
                style={{ 
                  transform: 'scale(0.8)', 
                  transformOrigin: 'top center',
                  width: '125%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={saveTemplate}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Guardar Plantilla
          </Button>
        </div>
      </div>
    </div>
  );
}