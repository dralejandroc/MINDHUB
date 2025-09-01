'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { TEMPLATE_MAP } from './templates';

interface FormXFormBuilderProps {
  templateId?: string;
  onNavigate: (view: string, data?: any) => void;
  onSave: () => void;
}

type BuilderStep = 'basics' | 'fields' | 'settings' | 'preview';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'tel' | 'date' | 'select' | 'checkbox' | 'radio' | 'scale' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  description?: string;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  estimatedTime: string;
  instructions?: string;
  fields: FormField[];
  settings: {
    allowMultipleSubmissions: boolean;
    requireAuthentication: boolean;
    showProgressBar: boolean;
    emailNotifications: boolean;
  };
}

const fieldTypes = [
  { type: 'text', label: 'Texto Corto', icon: '📝', description: 'Campo de texto simple para respuestas cortas' },
  { type: 'textarea', label: 'Texto Largo', icon: '📄', description: 'Área de texto para respuestas extensas' },
  { type: 'email', label: 'Email', icon: '📧', description: 'Campo específico para direcciones de correo' },
  { type: 'tel', label: 'Teléfono', icon: '📞', description: 'Campo para números telefónicos' },
  { type: 'date', label: 'Fecha', icon: '📅', description: 'Selector de fecha' },
  { type: 'select', label: 'Selección Única', icon: '☑️', description: 'Lista desplegable de opciones' },
  { type: 'radio', label: 'Opciones Múltiples', icon: '⚪', description: 'Botones de radio para elegir una opción' },
  { type: 'checkbox', label: 'Casillas', icon: '☑️', description: 'Casillas de verificación múltiples' },
  { type: 'scale', label: 'Escala Numérica', icon: '🔢', description: 'Escala del 1 al 10' },
  { type: 'file', label: 'Archivo', icon: '📎', description: 'Subida de documentos o imágenes' }
];

export function FormXFormBuilder({ templateId, onNavigate, onSave }: FormXFormBuilderProps) {
  const [currentStep, setCurrentStep] = useState<BuilderStep>('basics');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    estimatedTime: '5-10 min',
    instructions: '',
    fields: [],
    settings: {
      allowMultipleSubmissions: false,
      requireAuthentication: true,
      showProgressBar: true,
      emailNotifications: false
    }
  });

  const [selectedFieldType, setSelectedFieldType] = useState<string>('');
  const [editingField, setEditingField] = useState<FormField | null>(null);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = (id: string) => {
    const template = TEMPLATE_MAP[id as keyof typeof TEMPLATE_MAP];
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        description: template.description,
        category: template.category,
        estimatedTime: template.estimatedTime,
        instructions: template.instructions,
        fields: template.fields.map(field => ({
          ...field,
          id: field.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }))
      }));
      toast.success(`Template "${template.name}" cargado exitosamente`);
    } else {
      toast.error('Template no encontrado');
    }
  };

  const steps: { [key in BuilderStep]: { title: string; description: string; } } = {
    basics: {
      title: 'Información Básica',
      description: 'Define el nombre, descripción y categoría de tu formulario'
    },
    fields: {
      title: 'Campos del Formulario',
      description: 'Agrega y configura los campos que necesites'
    },
    settings: {
      title: 'Configuración',
      description: 'Ajusta las opciones avanzadas del formulario'
    },
    preview: {
      title: 'Vista Previa',
      description: 'Revisa cómo se verá el formulario antes de guardarlo'
    }
  };

  const stepOrder: BuilderStep[] = ['basics', 'fields', 'settings', 'preview'];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const nextStep = () => {
    if (currentStepIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(stepOrder[currentStepIndex - 1]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return formData.name.trim() && formData.description.trim() && formData.category.trim();
      case 'fields':
        return formData.fields.length > 0;
      case 'settings':
        return true;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const addField = (field: FormField) => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { ...field, id: Date.now().toString() }]
    }));
    setSelectedFieldType('');
    setEditingField(null);
    toast.success('Campo agregado exitosamente');
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    toast.success('Campo eliminado');
  };

  const saveForm = async () => {
    try {
      const formPayload = {
        name: formData.name,
        form_type: getCategoryKey(formData.category),
        description: formData.description,
        integration_type: 'expedix',
        auto_sync_expedix: formData.settings.requireAuthentication,
        expedix_mapping: {},
        fields: formData.fields.map((field, index) => ({
          field_name: field.label.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, ''),
          field_type: field.type,
          label: field.label,
          help_text: field.description || '',
          placeholder: field.placeholder || '',
          required: field.required,
          choices: field.options ? field.options.map((opt, i) => ({ value: opt, label: opt })) : [],
          min_value: field.min,
          max_value: field.max,
          expedix_field: getExpedixMapping(field.label)
        }))
      };

      const response = await fetch('/api/formx/django/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formPayload),
      });

      if (!response.ok) {
        throw new Error('Error creando formulario');
      }

      const result = await response.json();
      toast.success(`Formulario "${formData.name}" guardado exitosamente`);
      onSave();
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Error guardando el formulario. Inténtalo de nuevo.');
    }
  };

  const getCategoryKey = (category: string) => {
    const mapping: { [key: string]: string } = {
      'Admisión': 'intake',
      'Seguimiento': 'follow_up',
      'Psiquiatría Infantil': 'clinical',
      'Screening': 'survey',
      'Especialidad': 'clinical',
      'General': 'clinical'
    };
    return mapping[category] || 'clinical';
  };

  const getExpedixMapping = (label: string) => {
    const mapping: { [key: string]: string } = {
      'nombre': 'firstName',
      'nombre completo': 'firstName',
      'apellido': 'lastName',
      'email': 'email',
      'correo': 'email',
      'teléfono': 'phone',
      'telefono': 'phone',
      'fecha de nacimiento': 'dateOfBirth',
      'dirección': 'address',
      'direccion': 'address',
      'ciudad': 'city',
      'alergias': 'allergies',
      'medicamentos': 'currentMedications'
    };
    return mapping[label.toLowerCase()] || '';
  };

  const renderStepProgress = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {stepOrder.map((step, index) => (
          <div 
            key={step}
            className={`flex items-center ${index < stepOrder.length - 1 ? 'flex-1' : ''}`}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold
              ${index <= currentStepIndex 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {index < currentStepIndex ? <CheckIcon className="h-5 w-5" /> : index + 1}
            </div>
            {index < stepOrder.length - 1 && (
              <div className={`
                h-1 flex-1 mx-4
                ${index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {steps[currentStep].title}
        </h2>
        <p className="text-gray-600 text-sm">
          {steps[currentStep].description}
        </p>
      </div>
    </div>
  );

  const renderBasicsStep = () => (
    <Card className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Formulario <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ej: Formulario de Admisión de Pacientes"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe brevemente el propósito de este formulario..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una categoría</option>
            <option value="Admisión">Admisión</option>
            <option value="Seguimiento">Seguimiento</option>
            <option value="Psiquiatría Infantil">Psiquiatría Infantil</option>
            <option value="Screening">Screening</option>
            <option value="Especialidad">Especialidad</option>
            <option value="General">General</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiempo Estimado
          </label>
          <select
            value={formData.estimatedTime}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="5-10 min">5-10 minutos</option>
            <option value="10-15 min">10-15 minutos</option>
            <option value="15-20 min">15-20 minutos</option>
            <option value="20-30 min">20-30 minutos</option>
            <option value="30+ min">Más de 30 minutos</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instrucciones para el Paciente
        </label>
        <textarea
          value={formData.instructions || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
          placeholder="Instrucciones especiales que verá el paciente antes de completar el formulario..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </Card>
  );

  const renderFieldsStep = () => (
    <div className="space-y-6">
      {/* Lista de campos actuales */}
      {formData.fields.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Campos del Formulario ({formData.fields.length})</h3>
          <div className="space-y-3">
            {formData.fields.map((field, index) => (
              <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{index + 1}. {field.label}</span>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">Requerido</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    Tipo: {fieldTypes.find(ft => ft.type === field.type)?.label}
                    {field.options && ` • Opciones: ${field.options.join(', ')}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingField(field)}
                    className="text-blue-600"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.id)}
                    className="text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Selector de tipo de campo */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Agregar Nuevo Campo</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {fieldTypes.map((fieldType) => (
            <button
              key={fieldType.type}
              onClick={() => setSelectedFieldType(fieldType.type)}
              className={`
                p-3 text-left border rounded-lg transition-all
                ${selectedFieldType === fieldType.type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="text-lg mb-1">{fieldType.icon}</div>
              <div className="font-medium text-sm">{fieldType.label}</div>
              <div className="text-xs text-gray-600">{fieldType.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Formulario de configuración de campo */}
      {selectedFieldType && (
        <FieldConfigForm
          fieldType={selectedFieldType}
          editingField={editingField}
          onSave={addField}
          onCancel={() => {
            setSelectedFieldType('');
            setEditingField(null);
          }}
        />
      )}
    </div>
  );

  const renderSettingsStep = () => (
    <Card className="p-6 space-y-6">
      <h3 className="font-semibold text-gray-900 mb-4">Configuración del Formulario</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Permitir múltiples envíos</div>
            <div className="text-xs text-gray-600">Los pacientes pueden enviar el formulario varias veces</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.settings.allowMultipleSubmissions}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, allowMultipleSubmissions: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Requerir autenticación</div>
            <div className="text-xs text-gray-600">Solo pacientes registrados pueden acceder</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.settings.requireAuthentication}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, requireAuthentication: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Mostrar barra de progreso</div>
            <div className="text-xs text-gray-600">Los pacientes verán su progreso mientras completan</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.settings.showProgressBar}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, showProgressBar: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Notificaciones por email</div>
            <div className="text-xs text-gray-600">Recibir notificación cuando se complete un formulario</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.settings.emailNotifications}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, emailNotifications: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </Card>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <DocumentTextIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{formData.name}</h3>
            <p className="text-sm text-gray-600">{formData.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div>
            <span className="font-medium text-gray-700">Categoría:</span>
            <div>{formData.category}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tiempo:</span>
            <div>{formData.estimatedTime}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Campos:</span>
            <div>{formData.fields.length}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Requeridos:</span>
            <div>{formData.fields.filter(f => f.required).length}</div>
          </div>
        </div>

        {formData.instructions && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Instrucciones</h4>
            <p className="text-sm text-blue-800">{formData.instructions}</p>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Vista Previa de Campos:</h4>
          {formData.fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-sm">
                  {index + 1}. {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Badge variant="secondary" className="text-xs">
                  {fieldTypes.find(ft => ft.type === field.type)?.label}
                </Badge>
              </div>
              
              {field.type === 'textarea' && (
                <textarea 
                  placeholder={field.placeholder || 'Escribe tu respuesta aquí...'}
                  className="w-full p-2 border rounded text-sm" 
                  rows={3}
                  disabled
                />
              )}
              {field.type === 'text' && (
                <input 
                  type="text" 
                  placeholder={field.placeholder || 'Respuesta...'}
                  className="w-full p-2 border rounded text-sm" 
                  disabled
                />
              )}
              {field.type === 'select' && field.options && (
                <select className="w-full p-2 border rounded text-sm" disabled>
                  <option>Selecciona una opción...</option>
                  {field.options.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              )}
              
              {field.description && (
                <p className="text-xs text-gray-600 mt-1">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderNavigation = () => (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        onClick={prevStep}
        variant="outline"
        className="flex items-center gap-2"
        disabled={currentStepIndex === 0}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Anterior
      </Button>

      <div className="text-sm text-gray-600">
        Paso {currentStepIndex + 1} de {stepOrder.length}
      </div>

      {currentStepIndex === stepOrder.length - 1 ? (
        <Button
          onClick={saveForm}
          className="flex items-center gap-2"
        >
          <CheckIcon className="h-4 w-4" />
          Guardar Formulario
        </Button>
      ) : (
        <Button
          onClick={nextStep}
          className="flex items-center gap-2"
          disabled={!canProceed()}
        >
          Siguiente
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basics':
        return renderBasicsStep();
      case 'fields':
        return renderFieldsStep();
      case 'settings':
        return renderSettingsStep();
      case 'preview':
        return renderPreviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {renderStepProgress()}
      {renderCurrentStep()}
      {renderNavigation()}
    </div>
  );
}

// Componente auxiliar para configurar campos
interface FieldConfigFormProps {
  fieldType: string;
  editingField: FormField | null;
  onSave: (field: FormField) => void;
  onCancel: () => void;
}

function FieldConfigForm({ fieldType, editingField, onSave, onCancel }: FieldConfigFormProps) {
  const [fieldData, setFieldData] = useState<Partial<FormField>>({
    type: fieldType as FormField['type'],
    label: editingField?.label || '',
    placeholder: editingField?.placeholder || '',
    required: editingField?.required || false,
    options: editingField?.options || [],
    min: editingField?.min || 1,
    max: editingField?.max || 10,
    description: editingField?.description || '',
    ...editingField
  });

  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (newOption.trim()) {
      setFieldData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFieldData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSave = () => {
    if (!fieldData.label?.trim()) {
      toast.error('El label del campo es requerido');
      return;
    }

    onSave(fieldData as FormField);
  };

  const needsOptions = ['select', 'radio', 'checkbox'].includes(fieldType);
  const needsMinMax = fieldType === 'scale';

  return (
    <Card className="p-6">
      <h4 className="font-semibold text-gray-900 mb-4">
        Configurar Campo: {fieldTypes.find(ft => ft.type === fieldType)?.label}
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etiqueta del Campo <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={fieldData.label || ''}
            onChange={(e) => setFieldData(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Ej: Nombre completo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texto de ayuda (placeholder)
          </label>
          <Input
            type="text"
            value={fieldData.placeholder || ''}
            onChange={(e) => setFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
            placeholder="Texto que aparecerá como guía..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción adicional
          </label>
          <Input
            type="text"
            value={fieldData.description || ''}
            onChange={(e) => setFieldData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Información adicional para el usuario..."
          />
        </div>

        {needsMinMax && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mínimo
              </label>
              <Input
                type="number"
                value={fieldData.min || 1}
                onChange={(e) => setFieldData(prev => ({ ...prev, min: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Máximo
              </label>
              <Input
                type="number"
                value={fieldData.max || 10}
                onChange={(e) => setFieldData(prev => ({ ...prev, max: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        )}

        {needsOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opciones
            </label>
            <div className="space-y-2">
              {fieldData.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(fieldData.options || [])];
                      newOptions[index] = e.target.value;
                      setFieldData(prev => ({ ...prev, options: newOptions }));
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Nueva opción..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && addOption()}
                />
                <Button
                  onClick={addOption}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="required"
            checked={fieldData.required || false}
            onChange={(e) => setFieldData(prev => ({ ...prev, required: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="required" className="ml-2 text-sm text-gray-700">
            Campo requerido
          </label>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} className="flex-1">
            {editingField ? 'Actualizar Campo' : 'Agregar Campo'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}