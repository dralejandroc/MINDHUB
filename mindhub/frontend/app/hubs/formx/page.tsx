'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormBuilderProfessional } from '@/components/formx/FormBuilderProfessional';
import { MedicalFormTemplates } from '@/components/formx/MedicalFormTemplates';
import { PatientSelectorModal } from '@/components/formx/PatientSelectorModal';
import { FormAssignmentsManager } from '@/components/formx/FormAssignmentsManager';
import { FormManagementView } from '@/components/formx/FormManagementView';
import { DocumentTextIcon, PlusIcon, DocumentDuplicateIcon, ChartBarIcon, ClipboardDocumentListIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function FormXPage() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'builder' | 'templates' | 'responses' | 'assignments' | 'management'>('dashboard');
  const [forms, setForms] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalForms: 0,
    todayResponses: 0,
    totalResponses: 0,
    pendingAssignments: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedFormForAssignment, setSelectedFormForAssignment] = useState<any>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Load forms and stats
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load forms
        const formsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms`);
        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          setForms(formsData.data || []);
          
          setStats(prev => ({
            ...prev,
            totalForms: formsData.data?.length || 0
          }));
        }
        
        // Load real stats from backend
        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(prev => ({
            ...prev,
            totalForms: prev.totalForms,
            todayResponses: statsData.data?.todayResponses || 0,
            totalResponses: statsData.data?.totalResponses || 0,
            pendingAssignments: statsData.data?.pendingAssignments || 0
          }));
        }
        
      } catch (error) {
        console.error('Error loading FormX data:', error);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleNewForm = () => {
    setEditingForm(null);
    setCurrentView('builder');
  };

  const handleEditForm = async (form: any) => {
    try {
      // Load full form data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms/${form.id}`);
      if (response.ok) {
        const formData = await response.json();
        setEditingForm(formData.data);
        setCurrentView('builder');
      } else {
        toast.error('Error al cargar el formulario');
      }
    } catch (error) {
      console.error('Error loading form for edit:', error);
      toast.error('Error al cargar el formulario');
    }
  };

  const handleDuplicateForm = async (form: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms/${form.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${form.title} (Copia)` })
      });
      
      if (response.ok) {
        toast.success('Formulario duplicado exitosamente');
        // Refresh forms list
        const formsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms`);
        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          setForms(formsData.data || []);
        }
      } else {
        toast.error('Error al duplicar el formulario');
      }
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Error al duplicar el formulario');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleAssignFormClick = (form: any) => {
    setSelectedFormForAssignment(form);
    setShowPatientSelector(true);
  };

  const handlePatientSelected = (patient: any) => {
    // Refresh data after assignment
    const loadData = async () => {
      try {
        const formsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms`);
        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          setForms(formsData.data || []);
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };
    loadData();
  };

  if (currentView === 'builder') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="FormX - Constructor de Formularios"
          description="Crea formularios médicos personalizados con drag & drop"
          icon={DocumentTextIcon}
          iconColor="text-emerald-600"
          actions={[
            <Button
              key="back"
              onClick={handleBackToDashboard}
              variant="outline"
            >
              Volver al Dashboard
            </Button>
          ]}
        />
        
        <FormBuilderProfessional 
          editingForm={editingForm}
          onFormSaved={handleBackToDashboard}
        />
      </div>
    );
  }

  if (currentView === 'templates') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="FormX - Templates Médicos"
          description="Plantillas predefinidas para formularios médicos"
          icon={ClipboardDocumentListIcon}
          iconColor="text-emerald-600"
          actions={[
            <Button
              key="back"
              onClick={handleBackToDashboard}
              variant="outline"
            >
              Volver al Dashboard
            </Button>,
            <Button
              key="new-form"
              onClick={handleNewForm}
              variant="emerald"
              size="sm"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Crear Personalizado
            </Button>
          ]}
        />
        
        <MedicalFormTemplates />
      </div>
    );
  }

  if (currentView === 'responses') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="FormX - Respuestas de Pacientes"
          description="Gestiona y analiza las respuestas de los formularios"
          icon={ChartBarIcon}
          iconColor="text-emerald-600"
          actions={[
            <Button
              key="back"
              onClick={handleBackToDashboard}
              variant="outline"
            >
              Volver al Dashboard
            </Button>
          ]}
        />
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Respuestas</h3>
            <p className="text-gray-600 mb-6">
              Aquí podrás ver y analizar todas las respuestas de los pacientes a los formularios asignados.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-primary-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary-600">{stats.totalResponses}</div>
                <div className="text-sm text-primary-800">Total Respuestas</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-600">{stats.todayResponses}</div>
                <div className="text-sm text-emerald-800">Respuestas Hoy</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingAssignments}</div>
                <div className="text-sm text-orange-800">Pendientes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'assignments') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="FormX - Asignaciones de Formularios"
          description="Asigna formularios a pacientes y gestiona tokens"
          icon={UserGroupIcon}
          iconColor="text-emerald-600"
          actions={[
            <Button
              key="back"
              onClick={handleBackToDashboard}
              variant="outline"
            >
              Volver al Dashboard
            </Button>
          ]}
        />
        
        <FormAssignmentsManager 
          forms={forms}
          onRefresh={() => {
            // Refresh forms and stats
            const loadData = async () => {
              try {
                const formsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms`);
                if (formsResponse.ok) {
                  const formsData = await formsResponse.json();
                  setForms(formsData.data || []);
                }
              } catch (error) {
                console.error('Error refreshing data:', error);
              }
            };
            loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="FormX - Generador de Formularios"
        description="Crea y gestiona formularios médicos personalizados"
        icon={DocumentTextIcon}
        iconColor="text-emerald-600"
        actions={[
          <Button
            key="new-form"
            onClick={handleNewForm}
            variant="emerald"
            size="sm"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            Nuevo Formulario
          </Button>
        ]}
      />
      
      {/* Dashboard View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Crear Formularios</h3>
            <PlusIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Constructor drag & drop con campos médicos especializados y lógica condicional avanzada.
          </p>
          <Button 
            onClick={handleNewForm}
            variant="outline" 
            size="sm"
            className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          >
            Crear Nuevo
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Templates Médicos</h3>
            <DocumentDuplicateIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Historia clínica completa, consentimientos informados y evaluaciones pre/post consulta.
          </p>
          <Button 
            onClick={() => setCurrentView('templates')}
            variant="outline" 
            size="sm"
            className="w-full border-primary-200 text-primary-600 hover:bg-primary-50"
          >
            Ver Templates
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Asignar a Pacientes</h3>
            <UserGroupIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Asigna formularios específicos a pacientes con enlaces seguros y tokenizados.
          </p>
          <Button 
            onClick={() => setCurrentView('assignments')}
            variant="outline" 
            size="sm"
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            Gestionar
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Analizar Respuestas</h3>
            <ChartBarIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Analiza respuestas de pacientes, exporta datos e integra con expedientes médicos.
          </p>
          <Button 
            onClick={() => setCurrentView('responses')}
            variant="outline" 
            size="sm"
            className="w-full border-secondary-200 text-secondary-600 hover:bg-secondary-50"
          >
            Ver Análisis
          </Button>
        </div>
      </div>

      {/* Recent Forms */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-dark-green">Mis Formularios ({forms.length})</h3>
          {forms.length > 0 && (
            <Button onClick={handleNewForm} size="sm" variant="outline" className="text-xs">
              <PlusIcon className="h-3 w-3 mr-1" />
              Nuevo
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                  <div className="h-5 w-5 bg-gray-200 rounded mr-2"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : forms.length > 0 ? (
          <div className="space-y-3">
            {forms.slice(0, 5).map((form) => (
              <div key={form.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-emerald-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900 text-xs">{form.title}</div>
                    <div className="text-xs text-gray-500">
                      Creado {new Date(form.createdAt || form.created_at).toLocaleDateString()}
                      {form.sections && ` • ${form.sections.reduce((acc: number, section: any) => acc + (section.fields?.length || 0), 0)} campos`}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleEditForm(form)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleAssignFormClick(form)}
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            ))}
            
            {forms.length > 5 && (
              <div className="text-center pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setCurrentView('management')}
                >
                  Ver todos ({forms.length})
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mb-3" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">¡Crea tu primer formulario médico!</p>
              <p className="text-xs text-gray-500 mb-4">
                Comienza con un template predefinido o crea uno desde cero
              </p>
              <div className="flex space-x-2">
                <Button onClick={handleNewForm} size="sm" variant="primary">
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Crear Formulario
                </Button>
                <Button onClick={() => setCurrentView('templates')} size="sm" variant="outline">
                  Ver Templates
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
        <h3 className="text-sm font-semibold text-dark-green mb-3">Estadísticas de FormX</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <div className="text-lg font-bold text-emerald-600">{stats.totalForms}</div>
            <div className="text-xs text-emerald-700">Formularios Activos</div>
          </div>
          <div className="text-center p-3 bg-secondary-50 rounded-lg">
            <div className="text-lg font-bold text-secondary-600">{stats.todayResponses}</div>
            <div className="text-xs text-secondary-700">Respuestas Hoy</div>
          </div>
          <div className="text-center p-3 bg-primary-50 rounded-lg">
            <div className="text-lg font-bold text-primary-600">{stats.totalResponses}</div>
            <div className="text-xs text-primary-700">Total Respuestas</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{stats.pendingAssignments}</div>
            <div className="text-xs text-orange-700">Asignaciones Pendientes</div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Integración con expedientes:</span>
            <span className="text-green-600 font-medium">✓ Activa</span>
          </div>
        </div>
      </div>
      {/* FormX Features */}
      <div className="bg-gradient-to-r from-emerald-50 to-primary-50 rounded-2xl shadow-lg border border-emerald-100 p-6 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-emerald">
        <h3 className="text-lg font-semibold text-dark-green mb-4">Características de FormX</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <PlusIcon className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Constructor Drag & Drop</h4>
              <p className="text-xs text-gray-600">Interfaz intuitiva para crear formularios complejos</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <DocumentDuplicateIcon className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Templates Médicos</h4>
              <p className="text-xs text-gray-600">Formularios preconstruidos validados científicamente</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserGroupIcon className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Asignación Tokenizada</h4>
              <p className="text-xs text-gray-600">Enlaces seguros personalizados por paciente</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <ChartBarIcon className="h-4 w-4 text-secondary-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Integración Completa</h4>
              <p className="text-xs text-gray-600">Datos directos al expediente del paciente</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Escalas Clinimetrix</h4>
              <p className="text-xs text-gray-600">Integración opcional con escalas clínicas</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DocumentTextIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Aviso de Privacidad</h4>
              <p className="text-xs text-gray-600">Cumplimiento legal configurable por usuario</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Selector Modal */}
      {showPatientSelector && selectedFormForAssignment && (
        <PatientSelectorModal
          isOpen={showPatientSelector}
          onClose={() => {
            setShowPatientSelector(false);
            setSelectedFormForAssignment(null);
          }}
          onSelectPatient={handlePatientSelected}
          formId={selectedFormForAssignment.id}
          formTitle={selectedFormForAssignment.title}
        />
      )}

      {/* Form Management View */}
      {currentView === 'management' && (
        <FormManagementView
          forms={forms}
          onEditForm={handleEditForm}
          onDuplicateForm={handleDuplicateForm}
          onAssignForm={handleAssignFormClick}
          onRefresh={() => {
            const loadData = async () => {
              try {
                const formsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms`);
                if (formsResponse.ok) {
                  const formsData = await formsResponse.json();
                  setForms(formsData.data || []);
                }
              } catch (error) {
                console.error('Error refreshing data:', error);
              }
            };
            loadData();
          }}
        />
      )}
    </div>
  );

  if (currentView === 'management') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="FormX - Gestión de Formularios"
          description="Busca, edita y organiza todos tus formularios médicos"
          icon={DocumentTextIcon}
          iconColor="text-emerald-600"
          actions={[
            <Button
              key="back"
              onClick={handleBackToDashboard}
              variant="outline"
            >
              Volver al Dashboard
            </Button>,
            <Button
              key="new-form"
              onClick={handleNewForm}
              variant="emerald"
              size="sm"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Nuevo Formulario
            </Button>
          ]}
        />
        
        <FormManagementView
          forms={forms}
          onEditForm={handleEditForm}
          onDuplicateForm={handleDuplicateForm}
          onAssignForm={handleAssignFormClick}
          onRefresh={() => {
            const loadData = async () => {
              try {
                const formsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/formx/forms`);
                if (formsResponse.ok) {
                  const formsData = await formsResponse.json();
                  setForms(formsData.data || []);
                }
              } catch (error) {
                console.error('Error refreshing data:', error);
              }
            };
            loadData();
          }}
        />
      </div>
    );
  }}
