'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  PlusIcon,
  TrashIcon,
  DuplicateIcon,
  Cog6ToothIcon,
  EyeIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import DynamicFormField, { FormField, FormFieldOption } from './DynamicFormField';

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
  fields: FormField[];
}

interface FormBuilderProps {
  template?: FormTemplate;
  onSave: (template: FormTemplate) => void;
  onCancel: () => void;
}

const FIELD_TYPES = [
  { 
    type: 'section_header', 
    label: 'Encabezado de Sección', 
    icon: '📋',
    description: 'Organiza el formulario en secciones'
  },
  { 
    type: 'short_text', 
    label: 'Texto Corto', 
    icon: '📝',
    description: 'Campo de texto de una línea'
  },
  { 
    type: 'long_text', 
    label: 'Texto Largo', 
    icon: '📄',
    description: 'Campo de texto de múltiples líneas'
  },
  { 
    type: 'paragraph', 
    label: 'Párrafo', 
    icon: '📃',
    description: 'Área de texto extensa'
  },
  { 
    type: 'number', 
    label: 'Número', 
    icon: '🔢',
    description: 'Campo numérico con validación'
  },
  { 
    type: 'dropdown', 
    label: 'Lista Desplegable', 
    icon: '📋',
    description: 'Selección de una opción'
  },
  { 
    type: 'radio', 
    label: 'Opción Múltiple', 
    icon: '🔘',
    description: 'Selección única entre opciones'
  },
  { 
    type: 'multi_select', 
    label: 'Selección Múltiple', 
    icon: '☑️',
    description: 'Múltiples opciones seleccionables'
  },
  { 
    type: 'slider', 
    label: 'Deslizador', 
    icon: '🎚️',
    description: 'Control deslizante numérico'
  },
  { 
    type: 'rating', 
    label: 'Calificación', 
    icon: '⭐',
    description: 'Sistema de calificación por estrellas'
  },
  { 
    type: 'scale_10', 
    label: 'Escala 1-10', 
    icon: '📊',
    description: 'Escala numérica del 1 al 10'
  },
  { 
    type: 'yes_no', 
    label: 'Sí/No', 
    icon: '✅',
    description: 'Respuesta binaria'
  },
  { 
    type: 'date', 
    label: 'Fecha', 
    icon: '📅',
    description: 'Selector de fecha'
  },
  { 
    type: 'time', 
    label: 'Hora', 
    icon: '🕐',
    description: 'Selector de hora'
  },
  { 
    type: 'likert_scale', 
    label: 'Escala Likert', 
    icon: '📈',
    description: 'Escala de actitudes múltiple'
  },
  { 
    type: 'multi_select_grid', 
    label: 'Matriz de Selección', 
    icon: '⚏',
    description: 'Tabla con opciones múltiples'
  },
  { 
    type: 'calculated_field', 
    label: 'Campo Calculado', 
    icon: '🧮',
    description: 'Cálculo automático basado en otros campos'
  },
  { 
    type: 'divider', 
    label: 'Separador', 
    icon: '➖',
    description: 'Línea divisoria visual'
  }
];

export default function FormBuilder({ template, onSave, onCancel }: FormBuilderProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'custom'
  });
  
  const [fields, setFields] = useState<FormField[]>(template?.fields || []);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);

  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: generateFieldId(),
      type: fieldType,
      label: `Nuevo ${FIELD_TYPES.find(ft => ft.type === fieldType)?.label || 'Campo'}`,
      required: false,
      order: fields.length + 1,
      ...(needsOptions(fieldType) && { options: [{ value: 'option1', label: 'Opción 1' }] }),
      ...(fieldType === 'slider' && { 
        validation: { min: 0, max: 10, step: 1 },
        displayValue: true,
        labels: { min: 'Mínimo', max: 'Máximo' }
      }),
      ...(fieldType === 'number' && { validation: { min: 0, max: 100 } }),
      ...(fieldType.includes('text') && { validation: { maxLength: 500 } }),
      ...(fieldType === 'section_header' && { 
        styling: {
          backgroundColor: 'var(--primary-50)',
          textColor: 'var(--primary-700)',
          fontSize: '18px',
          fontWeight: 'bold'
        }
      }),
      ...(fieldType === 'likert_scale' && {
        items: [{ id: 'item1', label: 'Elemento 1' }],
        scale: {
          min: 1,
          max: 5,
          labels: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo']
        }
      }),
      ...(fieldType === 'multi_select_grid' && {
        rows: [{ id: 'row1', label: 'Fila 1' }],
        columns: [{ id: 'col1', label: 'Columna 1' }]
      }),
      ...(fieldType === 'calculated_field' && {
        calculation: {
          type: 'sum',
          fields: [],
          displayAs: 'score_with_interpretation'
        },
        interpretation: {
          ranges: [
            { min: 0, max: 25, label: 'Bajo', color: 'green' },
            { min: 26, max: 75, label: 'Medio', color: 'yellow' },
            { min: 76, max: 100, label: 'Alto', color: 'red' }
          ]
        }
      })
    };

    setFields([...fields, newField]);
    setSelectedField(newField);
    setShowFieldConfig(true);
  };

  const needsOptions = (fieldType: string) => {
    return ['dropdown', 'radio', 'multi_select'].includes(fieldType);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
      setShowFieldConfig(false);
    }
  };

  const duplicateField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const duplicatedField = {
        ...field,
        id: generateFieldId(),
        label: `${field.label} (Copia)`,
        order: fields.length + 1
      };
      setFields([...fields, duplicatedField]);
    }
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
      
      // Actualizar orden
      newFields.forEach((field, index) => {
        field.order = index + 1;
      });
      
      setFields(newFields);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const newFields = Array.from(fields);
    const [reorderedField] = newFields.splice(result.source.index, 1);
    newFields.splice(result.destination.index, 0, reorderedField);

    // Actualizar orden
    newFields.forEach((field, index) => {
      field.order = index + 1;
    });

    setFields(newFields);
    setDraggedField(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('El nombre del formulario es requerido');
      return;
    }

    const templateToSave: FormTemplate = {
      id: template?.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      isSystem: template?.isSystem || false,
      fields: fields.map((field, index) => ({ ...field, order: index + 1 }))
    };

    onSave(templateToSave);
  };

  const renderFieldConfiguration = () => {
    if (!selectedField) return null;

    return (
      <div className="space-y-6">
        {/* Configuración básica */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--dark-green)' }}>
            Configuración Básica
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                Etiqueta del Campo
              </label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--neutral-300)' }}
              />
            </div>

            {!['section_header', 'divider', 'calculated_field'].includes(selectedField.type) && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                    Texto de Ayuda
                  </label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                    placeholder="Texto que aparece dentro del campo..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--neutral-300)' }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--primary-500)' }}
                  />
                  <label className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>
                    Campo requerido
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Opciones para campos de selección */}
        {needsOptions(selectedField.type) && (
          <div>
            <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--dark-green)' }}>
              Opciones
            </h4>
            
            <div className="space-y-3">
              {selectedField.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => {
                      const newOptions = [...(selectedField.options || [])];
                      newOptions[index] = { ...option, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                      updateField(selectedField.id, { options: newOptions });
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--neutral-300)' }}
                    placeholder={`Opción ${index + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newOptions = selectedField.options?.filter((_, i) => i !== index);
                      updateField(selectedField.id, { options: newOptions });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newOptions = [
                    ...(selectedField.options || []),
                    { value: `option_${(selectedField.options?.length || 0) + 1}`, label: `Opción ${(selectedField.options?.length || 0) + 1}` }
                  ];
                  updateField(selectedField.id, { options: newOptions });
                }}
                className="w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ 
                  borderColor: 'var(--primary-300)',
                  color: 'var(--primary-600)'
                }}
              >
                <PlusIcon className="h-4 w-4 inline mr-2" />
                Agregar Opción
              </button>
            </div>
          </div>
        )}

        {/* Configuración de slider */}
        {selectedField.type === 'slider' && (
          <div>
            <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--dark-green)' }}>
              Configuración del Deslizador
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                  Valor Mínimo
                </label>
                <input
                  type="number"
                  value={selectedField.validation?.min || 0}
                  onChange={(e) => updateField(selectedField.id, { 
                    validation: { ...selectedField.validation, min: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--neutral-300)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                  Valor Máximo
                </label>
                <input
                  type="number"
                  value={selectedField.validation?.max || 10}
                  onChange={(e) => updateField(selectedField.id, { 
                    validation: { ...selectedField.validation, max: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--neutral-300)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                  Paso
                </label>
                <input
                  type="number"
                  value={selectedField.validation?.step || 1}
                  onChange={(e) => updateField(selectedField.id, { 
                    validation: { ...selectedField.validation, step: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--neutral-300)' }}
                  step="0.1"
                  min="0.1"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedField.displayValue}
                  onChange={(e) => updateField(selectedField.id, { displayValue: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>
                  Mostrar valor actual
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                    Etiqueta Mínima
                  </label>
                  <input
                    type="text"
                    value={selectedField.labels?.min || ''}
                    onChange={(e) => updateField(selectedField.id, { 
                      labels: { ...selectedField.labels, min: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--neutral-300)' }}
                    placeholder="Ej: Nunca"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                    Etiqueta Máxima
                  </label>
                  <input
                    type="text"
                    value={selectedField.labels?.max || ''}
                    onChange={(e) => updateField(selectedField.id, { 
                      labels: { ...selectedField.labels, max: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--neutral-300)' }}
                    placeholder="Ej: Siempre"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuración de validación para campos de texto y número */}
        {(selectedField.type.includes('text') || selectedField.type === 'number') && (
          <div>
            <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--dark-green)' }}>
              Validación
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {selectedField.type === 'number' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                      Valor Mínimo
                    </label>
                    <input
                      type="number"
                      value={selectedField.validation?.min || ''}
                      onChange={(e) => updateField(selectedField.id, { 
                        validation: { ...selectedField.validation, min: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--neutral-300)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                      Valor Máximo
                    </label>
                    <input
                      type="number"
                      value={selectedField.validation?.max || ''}
                      onChange={(e) => updateField(selectedField.id, { 
                        validation: { ...selectedField.validation, max: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--neutral-300)' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                      Longitud Mínima
                    </label>
                    <input
                      type="number"
                      value={selectedField.validation?.minLength || ''}
                      onChange={(e) => updateField(selectedField.id, { 
                        validation: { ...selectedField.validation, minLength: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--neutral-300)' }}
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                      Longitud Máxima
                    </label>
                    <input
                      type="number"
                      value={selectedField.validation?.maxLength || ''}
                      onChange={(e) => updateField(selectedField.id, { 
                        validation: { ...selectedField.validation, maxLength: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--neutral-300)' }}
                      min="1"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Panel principal del constructor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div 
          className="bg-white border-b px-6 py-4"
          style={{ borderColor: 'var(--neutral-200)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: 'var(--dark-green)' }}
              >
                {template ? 'Editar Formulario' : 'Crear Formulario'}
              </h1>
              <p 
                className="text-sm mt-1"
                style={{ color: 'var(--neutral-600)' }}
              >
                Diseña formularios personalizados para evaluaciones clínicas
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2
                  ${showPreview 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <EyeIcon className="h-4 w-4" />
                <span>{showPreview ? 'Ocultar Vista Previa' : 'Vista Previa'}</span>
              </button>
              
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSave}
                className="px-6 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-1"
                style={{ 
                  background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))',
                  boxShadow: '0 8px 20px -5px rgba(41, 169, 140, 0.3)'
                }}
              >
                <CheckIcon className="h-4 w-4 inline mr-2" />
                Guardar Formulario
              </button>
            </div>
          </div>
          
          {/* Información del formulario */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                Nombre del Formulario *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--neutral-300)' }}
                placeholder="Ej: Evaluación Psicológica Inicial"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--neutral-300)' }}
              >
                <option value="custom">Personalizado</option>
                <option value="psychological">Psicológico</option>
                <option value="medical">Médico</option>
                <option value="followup">Seguimiento</option>
                <option value="risk">Evaluación de Riesgo</option>
                <option value="screening">Tamizaje</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neutral-700)' }}>
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--neutral-300)' }}
                placeholder="Descripción breve del formulario..."
              />
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex">
          {/* Lista de tipos de campos */}
          <div 
            className="w-80 bg-white border-r p-6 overflow-y-auto"
            style={{ borderColor: 'var(--neutral-200)' }}
          >
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: 'var(--dark-green)' }}
            >
              Tipos de Campos
            </h3>
            
            <div className="space-y-2">
              {FIELD_TYPES.map((fieldType) => (
                <button
                  key={fieldType.type}
                  onClick={() => addField(fieldType.type)}
                  className="w-full p-3 text-left border-2 border-dashed rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                  style={{ borderColor: 'var(--neutral-200)' }}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{fieldType.icon}</span>
                    <div className="flex-1">
                      <div 
                        className="font-medium text-sm group-hover:text-blue-700"
                        style={{ color: 'var(--neutral-700)' }}
                      >
                        {fieldType.label}
                      </div>
                      <div 
                        className="text-xs mt-1 group-hover:text-blue-600"
                        style={{ color: 'var(--neutral-500)' }}
                      >
                        {fieldType.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Constructor de formulario */}
          <div className="flex-1 flex">
            {/* Área de construcción */}
            <div className="flex-1 p-6 overflow-y-auto">
              {fields.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon 
                    className="h-16 w-16 mx-auto mb-4"
                    style={{ color: 'var(--neutral-300)' }}
                  />
                  <h3 
                    className="text-lg font-medium mb-2"
                    style={{ color: 'var(--neutral-600)' }}
                  >
                    Formulario Vacío
                  </h3>
                  <p 
                    className="text-sm mb-4"
                    style={{ color: 'var(--neutral-500)' }}
                  >
                    Selecciona un tipo de campo de la lista izquierda para comenzar
                  </p>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="form-fields">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {fields.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  bg-white rounded-lg border-2 p-4 transition-all duration-200
                                  ${snapshot.isDragging ? 'shadow-lg rotate-2' : 'shadow-sm'}
                                  ${selectedField?.id === field.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                                `}
                              >
                                {/* Control bar */}
                                <div className="flex items-center justify-between mb-3">
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="flex items-center space-x-2 cursor-move"
                                  >
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <span 
                                      className="text-xs font-medium"
                                      style={{ color: 'var(--neutral-500)' }}
                                    >
                                      {FIELD_TYPES.find(ft => ft.type === field.type)?.label || field.type}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => moveField(field.id, 'up')}
                                      disabled={index === 0}
                                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <ArrowUpIcon className="h-4 w-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => moveField(field.id, 'down')}
                                      disabled={index === fields.length - 1}
                                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <ArrowDownIcon className="h-4 w-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        setSelectedField(field);
                                        setShowFieldConfig(true);
                                      }}
                                      className="p-1 text-blue-600 hover:text-blue-800"
                                    >
                                      <Cog6ToothIcon className="h-4 w-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => duplicateField(field.id)}
                                      className="p-1 text-green-600 hover:text-green-800"
                                    >
                                      <DuplicateIcon className="h-4 w-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => deleteField(field.id)}
                                      className="p-1 text-red-600 hover:text-red-800"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Campo preview */}
                                <div onClick={() => {
                                  setSelectedField(field);
                                  setShowFieldConfig(true);
                                }}>
                                  <DynamicFormField
                                    field={field}
                                    value={field.defaultValue}
                                    onChange={() => {}}
                                    disabled={true}
                                  />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            {/* Panel de configuración */}
            {showFieldConfig && (
              <div 
                className="w-96 bg-white border-l p-6 overflow-y-auto"
                style={{ borderColor: 'var(--neutral-200)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 
                    className="text-lg font-bold"
                    style={{ color: 'var(--dark-green)' }}
                  >
                    Configurar Campo
                  </h3>
                  <button
                    onClick={() => setShowFieldConfig(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                {renderFieldConfiguration()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vista previa */}
      {showPreview && (
        <div 
          className="w-1/2 bg-white border-l p-6 overflow-y-auto"
          style={{ borderColor: 'var(--neutral-200)' }}
        >
          <div className="mb-6">
            <h2 
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--dark-green)' }}
            >
              Vista Previa: {formData.name || 'Formulario Sin Nombre'}
            </h2>
            {formData.description && (
              <p 
                className="text-sm"
                style={{ color: 'var(--neutral-600)' }}
              >
                {formData.description}
              </p>
            )}
          </div>
          
          <div className="space-y-6">
            {fields.map((field) => (
              <DynamicFormField
                key={field.id}
                field={field}
                value={field.defaultValue}
                onChange={() => {}}
              />
            ))}
            
            {fields.length === 0 && (
              <div className="text-center py-8">
                <p 
                  className="text-sm"
                  style={{ color: 'var(--neutral-500)' }}
                >
                  Agrega campos al formulario para ver la vista previa
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}