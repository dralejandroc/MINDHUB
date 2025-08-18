'use client';

import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  LinkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormXUnifiedClient as FormXClient, FormXTemplate } from '@/lib/api/formx-unified-client';
import { calculateAge, getAgeGroup, getTemplateIdForAgeGroup, AgeGroup } from '@/lib/utils/age-utils';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  first_name: string;
  last_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  firstName?: string; // Support both naming conventions
  lastName?: string;
  paternalLastName?: string;
  maternalLastName?: string;
  email: string;
  cell_phone?: string;
  phone?: string;
  birth_date?: string;
  dateOfBirth?: string;
  lastVisit?: string;
  age?: number;
}

interface FormXPatientAssignmentProps {
  template?: FormXTemplate;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function FormXPatientAssignment({ template, onComplete, onCancel }: FormXPatientAssignmentProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentAssignments, setSentAssignments] = useState<{patientId: string, link: string}[]>([]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
        // Get patients from Expedix API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expedix/patients`, {
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers when available
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      } else {
        // Fallback to mock data for development
        setPatients([
          {
            id: '1',
            firstName: 'María',
            lastName: 'González',
            paternalLastName: 'González',
            maternalLastName: 'López',
            email: 'maria.gonzalez@email.com',
            phone: '+52 55 1234 5678',
            dateOfBirth: '1985-03-15',
            lastVisit: '2025-01-10'
          },
          {
            id: '2',
            firstName: 'Carlos',
            lastName: 'Rodríguez',
            paternalLastName: 'Rodríguez',
            maternalLastName: 'Martínez',
            email: 'carlos.rodriguez@email.com',
            phone: '+52 55 9876 5432',
            dateOfBirth: '1978-07-22',
            lastVisit: '2025-01-08'
          },
          {
            id: '3',
            firstName: 'Ana',
            lastName: 'Sánchez',
            paternalLastName: 'Sánchez',
            maternalLastName: 'García',
            email: 'ana.sanchez@email.com',
            phone: '+52 55 5555 7777',
            dateOfBirth: '1992-11-03',
            lastVisit: '2025-01-05'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const togglePatientSelection = (patient: Patient) => {
    setSelectedPatients(prev => {
      const isSelected = prev.some(p => p.id === patient.id);
      if (isSelected) {
        return prev.filter(p => p.id !== patient.id);
      } else {
        return [...prev, patient];
      }
    });
  };

  const handleSendForms = async () => {
    if (selectedPatients.length === 0) {
      toast.error('Selecciona al menos un paciente');
      return;
    }

    if (!template) {
      toast.error('No hay template seleccionado');
      return;
    }

    try {
      setSending(true);
      const assignments = [];

      for (const patient of selectedPatients) {
        try {
          const result = await FormXClient.assignFormToPatient({
            templateId: template.id,
            patientId: patient.id,
            patientEmail: patient.email
          });

          assignments.push({
            patientId: patient.id,
            link: result.link
          });

          toast.success(`Formulario enviado a ${patient.firstName} ${patient.lastName}`);
        } catch (error) {
          console.error(`Error sending to patient ${patient.id}:`, error);
          toast.error(`Error enviando a ${patient.firstName} ${patient.lastName}`);
        }
      }

      setSentAssignments(assignments);
      
      if (assignments.length > 0) {
        toast.success(`Formularios enviados exitosamente a ${assignments.length} pacientes`);
      }

    } catch (error) {
      console.error('Error sending forms:', error);
      toast.error('Error al enviar formularios');
    } finally {
      setSending(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  };

  // Helper function to get age-appropriate template suggestion
  const getTemplateRecommendation = (patient: Patient) => {
    const birthDate = patient.birth_date || patient.dateOfBirth;
    if (!birthDate) return null;
    
    const age = patient.age || calculateAge(birthDate);
    const ageGroup = getAgeGroup(age);
    const recommendedTemplateId = getTemplateIdForAgeGroup(ageGroup.id);
    
    return {
      age,
      ageGroup: ageGroup.name,
      ageRange: ageGroup.ageRange,
      recommendedTemplateId,
      isAgeAppropriate: template?.id === recommendedTemplateId
    };
  };

  const filteredPatients = patients.filter(patient => {
    // Support both naming conventions
    const firstName = patient.first_name || patient.firstName || '';
    const lastName = patient.last_name || patient.lastName || '';
    const paternalLastName = patient.paternal_last_name || patient.paternalLastName || '';
    const maternalLastName = patient.maternal_last_name || patient.maternalLastName || '';
    
    const fullName = `${firstName} ${lastName} ${paternalLastName} ${maternalLastName}`.toLowerCase();
    const email = patient.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Cargando pacientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Info */}
      {template && (
        <Card className="p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-8 w-8 text-emerald-600" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-emerald-900">{template.name}</h3>
              <p className="text-sm text-emerald-700">{template.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-emerald-600">
                <span>Tipo: {template.form_type}</span>
                <span>Campos: {template.total_fields}</span>
                {template.auto_sync_expedix && <span>✓ Auto-sync Expedix</span>}
              </div>
            </div>
            {/* Age appropriateness summary */}
            {patients.length > 0 && (
              <div className="text-right">
                <div className="text-xs text-emerald-600 mb-1">Compatibilidad por edad:</div>
                {(() => {
                  const patientsWithAge = patients.filter(p => p.dateOfBirth);
                  const appropriateCount = patientsWithAge.filter(p => {
                    const rec = getTemplateRecommendation(p);
                    return rec?.isAgeAppropriate;
                  }).length;
                  const total = patientsWithAge.length;
                  
                  return (
                    <div className={`text-sm font-medium ${
                      appropriateCount === total ? 'text-green-700' : 
                      appropriateCount > total / 2 ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {appropriateCount}/{total} pacientes
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Patient Search */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Seleccionar Pacientes</h3>
          <div className="text-sm text-gray-600">
            {selectedPatients.length} seleccionados
          </div>
        </div>
        
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar pacientes por nombre o email..."
            className="pl-10"
          />
        </div>

        {filteredPatients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">No se encontraron pacientes</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPatients.map((patient) => {
              const isSelected = selectedPatients.some(p => p.id === patient.id);
              const wasSent = sentAssignments.some(a => a.patientId === patient.id);
              const templateRec = getTemplateRecommendation(patient);
              
              // Extract names with both conventions support
              const firstName = patient.first_name || patient.firstName || '';
              const lastName = patient.last_name || patient.lastName || '';
              const paternalLastName = patient.paternal_last_name || patient.paternalLastName || '';
              const maternalLastName = patient.maternal_last_name || patient.maternalLastName || '';
              
              return (
                <div 
                  key={patient.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
                  } ${wasSent ? 'opacity-75' : ''}`}
                  onClick={() => !wasSent && togglePatientSelection(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded border ${
                        isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {isSelected && <CheckCircleIcon className="h-3 w-3 text-white" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {firstName} {paternalLastName} {maternalLastName}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <EnvelopeIcon className="h-4 w-4" />
                            <span>{patient.email}</span>
                          </div>
                          
                          {(patient.cell_phone || patient.phone) && (
                            <div className="flex items-center space-x-1">
                              <PhoneIcon className="h-4 w-4" />
                              <span>{patient.cell_phone || patient.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {patient.lastVisit && (
                          <div className="text-xs text-gray-500 mt-1">
                            Última visita: {new Date(patient.lastVisit).toLocaleDateString()}
                          </div>
                        )}
                        
                        {/* Age and template recommendation */}
                        {templateRec && (
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {templateRec.age} años • {templateRec.ageGroup}
                            </div>
                            {templateRec.isAgeAppropriate ? (
                              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Template apropiado
                              </div>
                            ) : (
                              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                ⚠️ Recomendado: {templateRec.ageRange}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {wasSent && (
                        <div className="flex items-center space-x-1">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-600">Enviado</span>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              const assignment = sentAssignments.find(a => a.patientId === patient.id);
                              if (assignment) {
                                copyLink(assignment.link);
                              }
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Selected Patients Summary */}
      {selectedPatients.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3">
            Pacientes Seleccionados ({selectedPatients.length})
          </h4>
          <div className="space-y-2">
            {selectedPatients.map((patient) => {
              const firstName = patient.first_name || patient.firstName || '';
              const paternalLastName = patient.paternal_last_name || patient.paternalLastName || '';
              
              return (
                <div key={patient.id} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">
                    {firstName} {paternalLastName} - {patient.email}
                  </span>
                  <Button
                    onClick={() => togglePatientSelection(patient)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <XCircleIcon className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Sent Assignments Summary */}
      {sentAssignments.length > 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h4 className="font-medium text-green-900 mb-3">
            Formularios Enviados ({sentAssignments.length})
          </h4>
          <div className="space-y-2">
            {sentAssignments.map((assignment) => {
              const patient = patients.find(p => p.id === assignment.patientId);
              const firstName = patient?.first_name || patient?.firstName || '';
              const paternalLastName = patient?.paternal_last_name || patient?.paternalLastName || '';
              
              return (
                <div key={assignment.patientId} className="flex items-center justify-between text-sm">
                  <span className="text-green-800">
                    {firstName} {paternalLastName} - {patient?.email}
                  </span>
                  <Button
                    onClick={() => copyLink(assignment.link)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Copiar Enlace
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={onCancel}
          variant="outline"
        >
          {sentAssignments.length > 0 ? 'Cerrar' : 'Cancelar'}
        </Button>
        
        {selectedPatients.length > 0 && sentAssignments.length === 0 && (
          <Button
            onClick={handleSendForms}
            variant="primary"
            disabled={sending}
          >
            {sending ? (
              <>
                <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                Enviar Formularios ({selectedPatients.length})
              </>
            )}
          </Button>
        )}
        
        {sentAssignments.length > 0 && (
          <Button
            onClick={onComplete}
            variant="primary"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Completar
          </Button>
        )}
      </div>
    </div>
  );
}