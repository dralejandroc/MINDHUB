'use client';

import React, { useState } from 'react';
import {
  UserIcon,
  HeartIcon,
  BeakerIcon,
  BrainIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  PencilIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

// Complete Medical Form Templates
export const COMPREHENSIVE_MEDICAL_TEMPLATES = {
  // Formulario completo de antecedentes médicos (basado en el JotForm)
  comprehensive_medical_history: {
    id: 'comprehensive_medical_history',
    title: 'Historia Clínica Completa',
    description: 'Formulario integral de antecedentes médicos para primera consulta',
    icon: ClipboardDocumentListIcon,
    category: 'intake',
    estimatedTime: '15-20 minutos',
    sections: [
      {
        id: 'general_info',
        title: 'Información General',
        description: 'Datos básicos del paciente',
        fields: [
          {
            type: 'text',
            label: 'Nombre completo',
            placeholder: 'Nombres y apellidos completos',
            required: true,
            validation: { min: 2, max: 100 }
          },
          {
            type: 'date',
            label: 'Fecha de nacimiento',
            required: true
          },
          {
            type: 'text',
            label: 'Edad',
            placeholder: 'Años cumplidos',
            required: true,
            validation: { pattern: '^[0-9]+$', message: 'Solo números' }
          },
          {
            type: 'radio',
            label: 'Sexo',
            options: ['Masculino', 'Femenino'],
            required: true
          },
          {
            type: 'text',
            label: 'Lugar de nacimiento',
            placeholder: 'Ciudad, Estado, País',
            required: false
          },
          {
            type: 'select',
            label: 'Estado civil',
            options: ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)', 'Unión libre'],
            required: true
          },
          {
            type: 'text',
            label: 'Ocupación actual',
            placeholder: 'Profesión o trabajo actual',
            required: false
          },
          {
            type: 'select',
            label: 'Nivel de estudios',
            options: ['Primaria', 'Secundaria', 'Bachillerato', 'Técnico', 'Licenciatura', 'Posgrado'],
            required: false
          }
        ]
      },
      {
        id: 'contact_info',
        title: 'Información de Contacto',
        description: 'Datos para comunicación',
        fields: [
          {
            type: 'text',
            label: 'Dirección completa',
            placeholder: 'Calle, número, colonia, ciudad',
            required: true
          },
          {
            type: 'phone',
            label: 'Teléfono principal',
            placeholder: '+52 555 123 4567',
            required: true
          },
          {
            type: 'phone',
            label: 'Teléfono alternativo',
            placeholder: '+52 555 123 4567',
            required: false
          },
          {
            type: 'email',
            label: 'Correo electrónico',
            placeholder: 'ejemplo@correo.com',
            required: true
          },
          {
            type: 'text',
            label: 'Contacto de emergencia - Nombre',
            placeholder: 'Nombre completo del contacto',
            required: true
          },
          {
            type: 'text',
            label: 'Contacto de emergencia - Relación',
            placeholder: 'Parentesco o relación',
            required: true
          },
          {
            type: 'phone',
            label: 'Contacto de emergencia - Teléfono',
            placeholder: '+52 555 123 4567',
            required: true
          }
        ]
      },
      {
        id: 'medical_history',
        title: 'Antecedentes Médicos',
        description: 'Historial médico personal',
        fields: [
          {
            type: 'radio',
            label: '¿Ha sido hospitalizado alguna vez?',
            options: ['Sí', 'No'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si respondió SÍ, especifique cuándo y por qué motivo',
            placeholder: 'Describa las hospitalizaciones, fechas y motivos',
            required: false,
            conditionalLogic: {
              showWhen: 'medical_history_hospitalized',
              operator: 'equals',
              value: 'Sí'
            }
          },
          {
            type: 'radio',
            label: '¿Ha tenido cirugías?',
            options: ['Sí', 'No'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si respondió SÍ, especifique qué cirugías y cuándo',
            placeholder: 'Describa las cirugías y fechas aproximadas',
            required: false
          },
          {
            type: 'checkbox',
            label: '¿Padece o ha padecido alguna de las siguientes enfermedades?',
            options: [
              'Diabetes',
              'Hipertensión arterial',
              'Enfermedades del corazón',
              'Problemas respiratorios (asma, EPOC)',
              'Enfermedades renales',
              'Problemas hepáticos',
              'Cáncer',
              'Enfermedades neurológicas',
              'Problemas de tiroides',
              'Enfermedades autoinmunes',
              'Ninguna de las anteriores'
            ],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si seleccionó alguna enfermedad, proporcione detalles',
            placeholder: 'Especifique diagnósticos, tratamientos y estado actual',
            required: false
          }
        ]
      },
      {
        id: 'medications_allergies',
        title: 'Medicamentos y Alergias',
        description: 'Información sobre medicamentos actuales y alergias',
        fields: [
          {
            type: 'radio',
            label: '¿Actualmente toma algún medicamento?',
            options: ['Sí', 'No'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si respondió SÍ, liste todos los medicamentos',
            placeholder: 'Nombre del medicamento, dosis, frecuencia y motivo',
            required: false
          },
          {
            type: 'radio',
            label: '¿Tiene alergias a medicamentos?',
            options: ['Sí', 'No', 'No lo sé'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si tiene alergias, especifique cuáles y qué reacciones',
            placeholder: 'Medicamento y tipo de reacción alérgica',
            required: false
          },
          {
            type: 'radio',
            label: '¿Tiene alergias a alimentos?',
            options: ['Sí', 'No'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si tiene alergias alimentarias, especifique',
            placeholder: 'Alimentos y tipo de reacción',
            required: false
          }
        ]
      },
      {
        id: 'family_history',
        title: 'Antecedentes Familiares',
        description: 'Historial médico familiar',
        fields: [
          {
            type: 'checkbox',
            label: '¿Algún familiar directo ha padecido?',
            options: [
              'Diabetes',
              'Hipertensión',
              'Enfermedades del corazón',
              'Cáncer',
              'Enfermedades mentales',
              'Problemas neurológicos',
              'Enfermedades renales',
              'Problemas de tiroides',
              'Ninguna de las anteriores'
            ],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si seleccionó alguna, especifique el parentesco y detalles',
            placeholder: 'Ej: Padre - diabetes tipo 2, Madre - hipertensión',
            required: false
          }
        ]
      },
      {
        id: 'lifestyle',
        title: 'Estilo de Vida',
        description: 'Hábitos y estilo de vida actual',
        fields: [
          {
            type: 'radio',
            label: '¿Fuma actualmente?',
            options: ['Sí', 'No', 'Dejé de fumar'],
            required: true
          },
          {
            type: 'text',
            label: 'Si fuma o fumaba, ¿cuántos cigarrillos al día?',
            placeholder: 'Número aproximado',
            required: false
          },
          {
            type: 'radio',
            label: '¿Consume alcohol?',
            options: ['Nunca', 'Ocasionalmente', 'Frecuentemente', 'Diariamente'],
            required: true
          },
          {
            type: 'radio',
            label: '¿Realiza ejercicio regularmente?',
            options: ['Sí, regularmente', 'Ocasionalmente', 'No'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Describa su tipo de ejercicio y frecuencia',
            placeholder: 'Ej: Caminar 30 min, 3 veces por semana',
            required: false
          },
          {
            type: 'select',
            label: '¿Cómo calificaría su dieta?',
            options: ['Muy saludable', 'Saludable', 'Regular', 'Poco saludable'],
            required: true
          }
        ]
      },
      {
        id: 'current_symptoms',
        title: 'Síntomas Actuales',
        description: 'Motivo de consulta y síntomas presentes',
        fields: [
          {
            type: 'textarea',
            label: '¿Cuál es el motivo principal de su consulta?',
            placeholder: 'Describa detalladamente el problema que lo trae a consulta',
            required: true
          },
          {
            type: 'text',
            label: '¿Cuándo comenzaron los síntomas?',
            placeholder: 'Fecha aproximada o tiempo transcurrido',
            required: true
          },
          {
            type: 'scale',
            label: 'En una escala del 1 al 10, ¿cómo calificaría la intensidad de sus síntomas?',
            min: 1,
            max: 10,
            required: true
          },
          {
            type: 'checkbox',
            label: '¿Qué síntomas presenta actualmente?',
            options: [
              'Dolor',
              'Fiebre',
              'Fatiga',
              'Náuseas',
              'Mareos',
              'Dificultad para respirar',
              'Problemas de sueño',
              'Pérdida de apetito',
              'Cambios de peso',
              'Otros'
            ],
            required: false
          },
          {
            type: 'textarea',
            label: 'Si seleccionó "Otros" o desea agregar detalles, especifique',
            placeholder: 'Describa otros síntomas o proporcione más detalles',
            required: false
          }
        ]
      },
      {
        id: 'mental_health',
        title: 'Salud Mental',
        description: 'Evaluación básica de salud mental',
        fields: [
          {
            type: 'scale',
            label: '¿Cómo calificaría su nivel de estrés actual? (1 = sin estrés, 10 = muy estresado)',
            min: 1,
            max: 10,
            required: true
          },
          {
            type: 'radio',
            label: '¿Ha recibido tratamiento psicológico o psiquiátrico anteriormente?',
            options: ['Sí', 'No'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si respondió SÍ, proporcione detalles',
            placeholder: 'Tipo de tratamiento, cuándo, motivo',
            required: false
          },
          {
            type: 'radio',
            label: '¿Ha tenido pensamientos de lastimarse a sí mismo o a otros?',
            options: ['Sí', 'No'],
            required: true
          },
          {
            type: 'select',
            label: '¿Cómo describiría su estado de ánimo general?',
            options: ['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo'],
            required: true
          }
        ]
      },
      {
        id: 'consent_privacy',
        title: 'Consentimiento y Privacidad',
        description: 'Autorización para el tratamiento médico',
        fields: [
          {
            type: 'checkbox',
            label: 'Consentimiento informado',
            options: [
              'Confirmo que la información proporcionada es veraz y completa',
              'Autorizo al médico a realizar los exámenes y tratamientos necesarios',
              'He sido informado sobre la confidencialidad de mis datos médicos',
              'Acepto el tratamiento de mis datos personales conforme a la Ley de Protección de Datos'
            ],
            required: true
          },
          {
            type: 'signature',
            label: 'Firma del paciente',
            required: true
          },
          {
            type: 'date',
            label: 'Fecha',
            required: true
          }
        ]
      }
    ],
    settings: {
      submitMessage: 'Gracias por completar su historia clínica. La información ha sido recibida y será revisada por el médico antes de su consulta.',
      emailNotifications: true,
      patientVisible: true,
      requireSignature: true,
      privacyNotice: `
        AVISO DE PRIVACIDAD

        De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, 
        le informamos que sus datos personales serán utilizados únicamente para:

        • Brindar atención médica y seguimiento de su estado de salud
        • Mantener un historial clínico completo y actualizado
        • Comunicarnos con usted sobre citas, tratamientos y seguimientos
        • Cumplir con obligaciones legales y regulatorias

        Sus datos están protegidos y no serán compartidos con terceros sin su consentimiento expreso, 
        excepto cuando sea requerido por ley.

        Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales.
      `
    }
  },

  // Template para consentimiento informado específico
  informed_consent: {
    id: 'informed_consent',
    title: 'Consentimiento Informado',
    description: 'Documento de consentimiento para procedimientos médicos',
    icon: ShieldCheckIcon,
    category: 'legal',
    estimatedTime: '5-10 minutos',
    sections: [
      {
        id: 'patient_info',
        title: 'Información del Paciente',
        fields: [
          { type: 'text', label: 'Nombre completo del paciente', required: true },
          { type: 'date', label: 'Fecha de nacimiento', required: true },
          { type: 'text', label: 'Documento de identidad', required: true }
        ]
      },
      {
        id: 'procedure_info',
        title: 'Información del Procedimiento',
        fields: [
          { type: 'text', label: 'Procedimiento a realizar', required: true },
          { type: 'text', label: 'Médico responsable', required: true },
          { type: 'date', label: 'Fecha programada', required: true }
        ]
      },
      {
        id: 'consent_declaration',
        title: 'Declaración de Consentimiento',
        fields: [
          {
            type: 'checkbox',
            label: 'Confirmo que:',
            options: [
              'He sido informado sobre la naturaleza del procedimiento',
              'Comprendo los riesgos y beneficios del procedimiento',
              'Se me han explicado las alternativas de tratamiento',
              'Todas mis preguntas han sido respondidas satisfactoriamente',
              'Otorgo mi consentimiento libre e informado para el procedimiento'
            ],
            required: true
          },
          { type: 'signature', label: 'Firma del paciente', required: true },
          { type: 'signature', label: 'Firma del médico', required: true },
          { type: 'date', label: 'Fecha', required: true }
        ]
      }
    ]
  },

  // Template para evaluación pre-consulta
  pre_consultation: {
    id: 'pre_consultation',
    title: 'Evaluación Pre-Consulta',
    description: 'Formulario rápido para preparar la consulta médica',
    icon: UserIcon,
    category: 'intake',
    estimatedTime: '5 minutos',
    sections: [
      {
        id: 'current_concern',
        title: 'Motivo de Consulta',
        fields: [
          {
            type: 'textarea',
            label: '¿Cuál es el motivo principal de su visita hoy?',
            placeholder: 'Describa brevemente por qué viene a consulta',
            required: true
          },
          {
            type: 'scale',
            label: 'Nivel de urgencia (1 = no urgente, 10 = muy urgente)',
            min: 1,
            max: 10,
            required: true
          },
          {
            type: 'text',
            label: '¿Cuándo comenzaron los síntomas?',
            placeholder: 'Ej: hace 3 días, desde la semana pasada',
            required: true
          }
        ]
      },
      {
        id: 'current_status',
        title: 'Estado Actual',
        fields: [
          {
            type: 'scale',
            label: '¿Cómo se siente hoy en general? (1 = muy mal, 10 = excelente)',
            min: 1,
            max: 10,
            required: true
          },
          {
            type: 'radio',
            label: '¿Ha tomado algún medicamento para sus síntomas?',
            options: ['Sí', 'No'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si tomó medicamentos, especifique cuáles',
            placeholder: 'Nombre del medicamento y dosis',
            required: false
          }
        ]
      }
    ]
  },

  // Template para seguimiento post-consulta
  post_consultation: {
    id: 'post_consultation',
    title: 'Seguimiento Post-Consulta',
    description: 'Evaluación de satisfacción y evolución del tratamiento',
    icon: HeartIcon,
    category: 'followup',
    estimatedTime: '3-5 minutos',
    sections: [
      {
        id: 'treatment_response',
        title: 'Respuesta al Tratamiento',
        fields: [
          {
            type: 'scale',
            label: '¿Cómo han evolucionado sus síntomas desde la última consulta? (1 = mucho peor, 10 = completamente mejor)',
            min: 1,
            max: 10,
            required: true
          },
          {
            type: 'radio',
            label: '¿Ha seguido el tratamiento indicado?',
            options: ['Sí, completamente', 'Parcialmente', 'No he podido seguirlo'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Si no ha seguido el tratamiento, explique por qué',
            placeholder: 'Efectos secundarios, costo, disponibilidad, etc.',
            required: false
          }
        ]
      },
      {
        id: 'satisfaction',
        title: 'Satisfacción',
        fields: [
          {
            type: 'scale',
            label: '¿Qué tan satisfecho está con la atención recibida? (1 = muy insatisfecho, 10 = muy satisfecho)',
            min: 1,
            max: 10,
            required: true
          },
          {
            type: 'textarea',
            label: 'Comentarios adicionales o sugerencias',
            placeholder: 'Sus comentarios nos ayudan a mejorar',
            required: false
          }
        ]
      }
    ]
  }
};

interface MedicalFormTemplatesProps {
  onTemplateSelect?: (templateKey: string, template: any) => void;
  onTemplatePreview?: (templateKey: string, template: any) => void;
  onOneClickCreate?: (templateKey: string, template: any) => void;
}

export const MedicalFormTemplates: React.FC<MedicalFormTemplatesProps> = ({
  onTemplateSelect,
  onTemplatePreview,
  onOneClickCreate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'complexity' | 'time'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<string | null>(null);

  // Get unique categories
  const categories = [...new Set(Object.values(COMPREHENSIVE_MEDICAL_TEMPLATES).map(t => t.category))];

  // Filter and sort templates
  const filteredTemplates = Object.entries(COMPREHENSIVE_MEDICAL_TEMPLATES)
    .filter(([key, template]) => {
      const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || template.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort(([keyA, templateA], [keyB, templateB]) => {
      switch (sortBy) {
        case 'name':
          return templateA.title.localeCompare(templateB.title);
        case 'complexity':
          const fieldsA = templateA.sections.reduce((acc, section) => acc + section.fields.length, 0);
          const fieldsB = templateB.sections.reduce((acc, section) => acc + section.fields.length, 0);
          return fieldsB - fieldsA; // More complex first
        case 'time':
          return templateA.estimatedTime.localeCompare(templateB.estimatedTime);
        default:
          return 0;
      }
    });

  const handleOneClickCreate = async (templateKey: string, template: any) => {
    setIsCreating(templateKey);
    try {
      // Create form directly from template
      const formData = {
        title: template.title,
        description: template.description,
        sections: template.sections.map((section: any, index: number) => ({
          ...section,
          id: `section_${Date.now()}_${index}`,
          fields: section.fields.map((field: any, fieldIndex: number) => ({
            ...field,
            id: `field_${Date.now()}_${index}_${fieldIndex}`
          }))
        })),
        settings: template.settings || {
          submitMessage: 'Gracias por completar el formulario.',
          emailNotifications: true,
          patientVisible: true,
          requireSignature: false
        }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedForm = await response.json();
        toast.success(`Formulario "${template.title}" creado exitosamente`);
        
        if (onOneClickCreate) {
          onOneClickCreate(templateKey, savedForm.data);
        }
      } else {
        throw new Error('Error al crear el formulario');
      }
    } catch (error) {
      console.error('Error creating form from template:', error);
      toast.error('Error al crear el formulario desde la plantilla');
    } finally {
      setIsCreating(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'intake': 'bg-blue-100 text-blue-800',
      'legal': 'bg-purple-100 text-purple-800',
      'followup': 'bg-green-100 text-green-800',
      'evaluation': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderTemplateCard = (templateKey: string, template: any) => {
    const IconComponent = template.icon;
    const totalFields = template.sections.reduce((acc: number, section: any) => acc + section.fields.length, 0);
    const isCreatingThis = isCreating === templateKey;

    return (
      <div
        key={templateKey}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <IconComponent className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-dark-green line-clamp-1">{template.title}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-gray-900">{template.sections.length}</div>
              <div className="text-gray-500 text-xs">Secciones</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-gray-900">{totalFields}</div>
              <div className="text-gray-500 text-xs">Campos</div>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <ClockIcon className="h-4 w-4 mr-1" />
            {template.estimatedTime}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => handleOneClickCreate(templateKey, template)}
              disabled={isCreatingThis}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center"
            >
              {isCreatingThis ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Ahora
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => onTemplateSelect?.(templateKey, template)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Personalizar
              </Button>
              <Button
                onClick={() => setPreviewTemplate({ key: templateKey, ...template })}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                Vista Previa
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-4">
        {filteredTemplates.map(([templateKey, template]) => {
          const IconComponent = template.icon;
          const totalFields = template.sections.reduce((acc: number, section: any) => acc + section.fields.length, 0);
          const isCreatingThis = isCreating === templateKey;

          return (
            <div key={templateKey} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="p-3 bg-primary-100 rounded-lg mr-4">
                    <IconComponent className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-dark-green mr-3">{template.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{template.sections.length} secciones</span>
                      <span>{totalFields} campos</span>
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {template.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleOneClickCreate(templateKey, template)}
                    disabled={isCreatingThis}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    {isCreatingThis ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Crear Ahora
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => onTemplateSelect?.(templateKey, template)}
                    variant="outline"
                    size="sm"
                  >
                    Personalizar
                  </Button>
                  <Button
                    onClick={() => setPreviewTemplate({ key: templateKey, ...template })}
                    variant="outline"
                    size="sm"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar templates médicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="lg:w-40">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'complexity' | 'time')}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="name">Por nombre</option>
              <option value="complexity">Por complejidad</option>
              <option value="time">Por tiempo</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="space-y-1 w-4 h-4">
                <div className="bg-current h-1 rounded-sm"></div>
                <div className="bg-current h-1 rounded-sm"></div>
                <div className="bg-current h-1 rounded-sm"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} de {Object.keys(COMPREHENSIVE_MEDICAL_TEMPLATES).length}
          </p>
        </div>
      </div>

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron templates</h3>
          <p className="text-gray-600">
            Prueba con diferentes términos de búsqueda o filtros
          </p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(([templateKey, template]) => renderTemplateCard(templateKey, template))}
          </div>
        ) : (
          renderListView()
        )
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUseTemplate={() => {
            onTemplateSelect?.(previewTemplate.key, previewTemplate);
            setPreviewTemplate(null);
          }}
          onCreateNow={() => {
            handleOneClickCreate(previewTemplate.key, previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
};

// Template Preview Modal Component
interface TemplatePreviewModalProps {
  template: any;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: () => void;
  onCreateNow: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  onCreateNow
}) => {
  if (!isOpen) return null;

  const IconComponent = template.icon;
  const totalFields = template.sections.reduce((acc: number, section: any) => acc + section.fields.length, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <IconComponent className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{template.title}</h2>
              <p className="text-sm text-gray-500">Vista previa del template</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">{template.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="font-semibold text-gray-900">{template.sections.length}</div>
                <div className="text-gray-500 text-xs">Secciones</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="font-semibold text-gray-900">{totalFields}</div>
                <div className="text-gray-500 text-xs">Campos</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="font-semibold text-gray-900">{template.estimatedTime}</div>
                <div className="text-gray-500 text-xs">Tiempo estimado</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="font-semibold text-gray-900">{template.category}</div>
                <div className="text-gray-500 text-xs">Categoría</div>
              </div>
            </div>
          </div>

          {/* Sections Preview */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Estructura del formulario</h3>
            {template.sections.map((section: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">{section.title}</h4>
                  {section.description && (
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  )}
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.fields.map((field: any, fieldIndex: number) => (
                      <div key={fieldIndex} className="flex items-center text-sm">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          field.required ? 'bg-red-400' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-gray-700">{field.label}</span>
                        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {field.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            <span className="inline-flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-400 mr-1"></div>
              Campo requerido
            </span>
            <span className="inline-flex items-center ml-4">
              <div className="w-2 h-2 rounded-full bg-gray-300 mr-1"></div>
              Campo opcional
            </span>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cerrar
            </Button>
            <Button
              onClick={onUseTemplate}
              variant="outline"
            >
              Personalizar
            </Button>
            <Button
              onClick={onCreateNow}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Crear Ahora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};