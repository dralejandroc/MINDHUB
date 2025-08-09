'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  UserIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  FolderIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name?: string;
  cell_phone: string;
  email?: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'pdf' | 'image' | 'video' | 'link' | 'text';
  fileSize?: string;
  tags: string[];
  previewUrl?: string;
}

interface SendingData {
  patientId: string;
  resourceIds: string[];
  deliveryMethod: 'whatsapp' | 'email' | 'both';
  personalMessage: string;
  scheduledFor: string; // For scheduling sends
  trackDelivery: boolean;
}

export default function ResourceSender() {
  const [currentStep, setCurrentStep] = useState<'patient' | 'resources' | 'delivery'>('patient');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [sendingData, setSendingData] = useState<SendingData>({
    patientId: '',
    resourceIds: [],
    deliveryMethod: 'whatsapp',
    personalMessage: '',
    scheduledFor: '',
    trackDelivery: true
  });

  const resourceCategories = [
    { id: 'all', name: 'Todos', count: 0 },
    { id: 'educational', name: 'Educativos', count: 0 },
    { id: 'forms', name: 'Formularios', count: 0 },
    { id: 'exercises', name: 'Ejercicios', count: 0 },
    { id: 'medications', name: 'Medicamentos', count: 0 },
    { id: 'diet', name: 'Alimentación', count: 0 },
    { id: 'lifestyle', name: 'Estilo de vida', count: 0 }
  ];

  const deliveryMethods = [
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      description: 'Envío inmediato por WhatsApp',
      icon: '📱',
      available: true 
    },
    { 
      id: 'email', 
      name: 'Email', 
      description: 'Envío por correo electrónico',
      icon: '📧',
      available: true 
    },
    { 
      id: 'both', 
      name: 'Ambos', 
      description: 'WhatsApp + Email',
      icon: '📬',
      available: true 
    }
  ];

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadAvailableResources();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      setSendingData(prev => ({ ...prev, patientId: selectedPatient.id }));
    }
  }, [selectedPatient]);

  useEffect(() => {
    setSendingData(prev => ({ ...prev, resourceIds: selectedResources }));
  }, [selectedResources]);

  const searchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expedix/patients?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.patients) {
        setPatients(data.patients.slice(0, 8));
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableResources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resources/library');
      const data = await response.json();
      
      if (data.success) {
        setAvailableResources(data.data);
      } else {
        // Mock data for development
        const mockResources: Resource[] = [
          {
            id: '1',
            title: 'Guía de Ejercicios Posturales',
            description: 'Ejercicios básicos para mejorar la postura corporal',
            category: 'exercises',
            type: 'pdf',
            fileSize: '2.1 MB',
            tags: ['postura', 'ejercicios', 'rehabilitación'],
            previewUrl: '/previews/ejercicios-posturales.jpg'
          },
          {
            id: '2',
            title: 'Información sobre Ansiedad',
            description: 'Guía completa sobre el manejo de la ansiedad',
            category: 'educational',
            type: 'pdf',
            fileSize: '1.8 MB',
            tags: ['ansiedad', 'salud mental', 'autoayuda']
          },
          {
            id: '3',
            title: 'Formulario de Seguimiento',
            description: 'Formulario para registro de síntomas diarios',
            category: 'forms',
            type: 'pdf',
            fileSize: '0.5 MB',
            tags: ['seguimiento', 'síntomas', 'registro']
          },
          {
            id: '4',
            title: 'Plan de Alimentación Saludable',
            description: 'Recomendaciones nutricionales básicas',
            category: 'diet',
            type: 'pdf',
            fileSize: '3.2 MB',
            tags: ['alimentación', 'nutrición', 'salud']
          },
          {
            id: '5',
            title: 'Técnicas de Relajación',
            description: 'Video con técnicas de respiración y relajación',
            category: 'lifestyle',
            type: 'video',
            fileSize: '25.6 MB',
            tags: ['relajación', 'respiración', 'mindfulness']
          }
        ];
        setAvailableResources(mockResources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentStep('resources');
  };

  const handleResourceToggle = (resourceId: string) => {
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const getFilteredResources = () => {
    let filtered = availableResources;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    if (resourceSearch) {
      const search = resourceSearch.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(search) ||
        resource.description.toLowerCase().includes(search) ||
        resource.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    return filtered;
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'link': return '🔗';
      case 'text': return '📝';
      default: return '📄';
    }
  };

  const sendResources = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch(`/api/frontdesk/resources/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendingData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Recursos enviados exitosamente');
        resetForm();
      } else {
        alert('Error al enviar recursos: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending resources:', error);
      alert('Error al enviar recursos');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('patient');
    setSelectedPatient(null);
    setSearchTerm('');
    setSelectedResources([]);
    setResourceSearch('');
    setSendingData({
      patientId: '',
      resourceIds: [],
      deliveryMethod: 'whatsapp',
      personalMessage: '',
      scheduledFor: '',
      trackDelivery: true
    });
  };

  const renderPatientStep = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Paciente</h4>
        
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar paciente por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {loading && (
          <div className="mt-4 flex items-center justify-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-gray-600">Buscando...</span>
          </div>
        )}

        {patients.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className="p-4 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name || ''}
                    </div>
                    <div className="text-sm text-gray-600">{patient.cell_phone}</div>
                    {patient.email && (
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderResourcesStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">Seleccionar Recursos</h4>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep('patient')}>
          Cambiar Paciente
        </Button>
      </div>

      {selectedPatient && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="font-medium text-blue-900">
                {selectedPatient.first_name} {selectedPatient.paternal_last_name}
              </div>
              <div className="text-sm text-blue-700">
                {selectedPatient.cell_phone} {selectedPatient.email && `• ${selectedPatient.email}`}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Buscar recursos..."
            value={resourceSearch}
            onChange={(e) => setResourceSearch(e.target.value)}
            className="pl-10"
          />
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {resourceCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Resources Summary */}
      {selectedResources.length > 0 && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FolderIcon className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-900">
                {selectedResources.length} recursos seleccionados
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep('delivery')}
              disabled={selectedResources.length === 0}
            >
              Continuar
            </Button>
          </div>
        </Card>
      )}

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {getFilteredResources().map((resource) => (
          <Card 
            key={resource.id} 
            className={`p-4 cursor-pointer transition-all ${
              selectedResources.includes(resource.id)
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => handleResourceToggle(resource.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-2xl">{getResourceTypeIcon(resource.type)}</div>
              {selectedResources.includes(resource.id) && (
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              )}
            </div>
            
            <h5 className="font-medium text-gray-900 mb-2">{resource.title}</h5>
            <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
            
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {resource.category}
              </span>
              {resource.fileSize && (
                <span className="text-gray-500">{resource.fileSize}</span>
              )}
            </div>
            
            {resource.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {resource.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {getFilteredResources().length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No se encontraron recursos con los filtros actuales</p>
        </div>
      )}
    </div>
  );

  const renderDeliveryStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">Configurar Envío</h4>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep('resources')}>
          Cambiar Recursos
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <h5 className="font-medium text-green-900 mb-2">Paciente</h5>
          <div className="text-sm text-green-800">
            {selectedPatient?.first_name} {selectedPatient?.paternal_last_name}
          </div>
          <div className="text-sm text-green-700">
            {selectedPatient?.cell_phone} {selectedPatient?.email && `• ${selectedPatient.email}`}
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">Recursos</h5>
          <div className="text-sm text-blue-800">
            {selectedResources.length} recursos seleccionados
          </div>
          <div className="text-xs text-blue-700">
            {availableResources
              .filter(r => selectedResources.includes(r.id))
              .map(r => r.title)
              .join(', ')
            }
          </div>
        </Card>
      </div>

      {/* Delivery Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Método de Envío
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {deliveryMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSendingData(prev => ({ ...prev, deliveryMethod: method.id as any }))}
              disabled={!method.available}
              className={`p-4 text-center rounded-lg border transition-colors ${
                sendingData.deliveryMethod === method.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : method.available
                    ? 'border-gray-300 hover:bg-gray-50'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="text-2xl mb-2">{method.icon}</div>
              <div className="font-medium">{method.name}</div>
              <div className="text-sm text-gray-600">{method.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Personal Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje Personal (opcional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Mensaje personalizado para acompañar los recursos..."
          value={sendingData.personalMessage}
          onChange={(e) => setSendingData(prev => ({ ...prev, personalMessage: e.target.value }))}
        />
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="trackDelivery"
            checked={sendingData.trackDelivery}
            onChange={(e) => setSendingData(prev => ({ ...prev, trackDelivery: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="trackDelivery" className="ml-2 text-sm text-gray-700">
            Rastrear entrega y confirmación de lectura
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="scheduleForLater"
            onChange={(e) => {
              if (!e.target.checked) {
                setSendingData(prev => ({ ...prev, scheduledFor: '' }));
              }
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="scheduleForLater" className="ml-2 text-sm text-gray-700">
            Programar envío para más tarde
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button variant="outline" onClick={() => setCurrentStep('resources')}>
          Atrás
        </Button>
        <Button
          onClick={sendResources}
          disabled={processing || selectedResources.length === 0}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Enviar Recursos
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <DocumentTextIcon className="h-6 w-6 mr-2 text-orange-600" />
          Envío de Recursos
        </h3>
        <p className="text-gray-600 mt-1">
          Envía materiales educativos y documentos directamente a tus pacientes
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { key: 'patient', name: 'Paciente', icon: UserIcon },
          { key: 'resources', name: 'Recursos', icon: DocumentTextIcon },
          { key: 'delivery', name: 'Envío', icon: PaperAirplaneIcon }
        ].map((step, index) => {
          const IconComponent = step.icon;
          const isActive = currentStep === step.key;
          const isCompleted = 
            (step.key === 'patient' && selectedPatient) ||
            (step.key === 'resources' && selectedResources.length > 0) ||
            (step.key === 'delivery' && currentStep === 'delivery');

          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                isActive ? 'bg-orange-600 text-white' :
                isCompleted ? 'bg-green-600 text-white' :
                'bg-gray-300 text-gray-600'
              }`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-orange-600' :
                isCompleted ? 'text-green-600' :
                'text-gray-500'
              }`}>
                {step.name}
              </span>
              {index < 2 && (
                <div className={`w-20 h-px mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {currentStep === 'patient' && renderPatientStep()}
      {currentStep === 'resources' && renderResourcesStep()}
      {currentStep === 'delivery' && renderDeliveryStep()}
    </div>
  );
}