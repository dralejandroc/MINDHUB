"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon,
  CalendarDaysIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  EnvelopeIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  email?: string;
  cell_phone?: string;
}

interface PrescriptionRefillData {
  patient_id: string;
  prescription_id: string;
  refill_date: string;
  refill_type: 'in_person' | 'whatsapp' | 'phone' | 'email' | 'remote';
  is_controlled_medication: boolean;
  notes: string;
}

interface PrescriptionRefillFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function PrescriptionRefillForm({
  onSuccess,
  onCancel,
  className
}: PrescriptionRefillFormProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PrescriptionRefillData>({
    patient_id: '',
    prescription_id: '',
    refill_date: new Date().toISOString().split('T')[0],
    refill_type: 'in_person',
    is_controlled_medication: false,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  const searchPatients = async () => {
    try {
      setSearchLoading(true);
      const response = await fetch(
        `/api/expedix/django/patients/?search=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPatients(data.results || data);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      ...formData,
      patient_id: patient.id
    });
    setPatients([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error('Debe seleccionar un paciente');
      return;
    }

    if (!formData.prescription_id.trim()) {
      toast.error('Debe ingresar el ID de la prescripción');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/analytics/django/prescription-refills/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          created_by: localStorage.getItem('userId') || 'current-user'
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar el resurtido');
      }

      toast.success('Resurtido de receta registrado exitosamente');
      
      // Reset form
      setFormData({
        patient_id: '',
        prescription_id: '',
        refill_date: new Date().toISOString().split('T')[0],
        refill_type: 'in_person',
        is_controlled_medication: false,
        notes: ''
      });
      setSelectedPatient(null);
      
      onSuccess?.();
      
    } catch (error) {
      console.error('Error registering prescription refill:', error);
      toast.error('Error al registrar el resurtido');
    } finally {
      setLoading(false);
    }
  };

  const refillTypeOptions = [
    { value: 'in_person', label: 'Presencial', icon: UserIcon, color: 'bg-blue-100 text-blue-800' },
    { value: 'whatsapp', label: 'WhatsApp', icon: PhoneIcon, color: 'bg-green-100 text-green-800' },
    { value: 'phone', label: 'Teléfono', icon: PhoneIcon, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'email', label: 'Email', icon: EnvelopeIcon, color: 'bg-purple-100 text-purple-800' },
    { value: 'remote', label: 'Remoto', icon: ComputerDesktopIcon, color: 'bg-gray-100 text-gray-800' },
  ];

  const selectedRefillType = refillTypeOptions.find(option => option.value === formData.refill_type);

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardDocumentListIcon className="h-6 w-6" />
          Registrar Resurtido de Receta
        </CardTitle>
        <CardDescription>
          Registra un resurtido de medicamentos sin consulta presencial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label htmlFor="patient-search">Buscar Paciente</Label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">
                    {selectedPatient.first_name} {selectedPatient.paternal_last_name} {selectedPatient.maternal_last_name}
                  </p>
                  {selectedPatient.email && (
                    <p className="text-sm text-blue-700">{selectedPatient.email}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(null);
                    setFormData({ ...formData, patient_id: '' });
                  }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  id="patient-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, apellido, email..."
                  className="w-full"
                />
                {searchLoading && (
                  <p className="text-sm text-gray-500">Buscando pacientes...</p>
                )}
                {patients.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 focus:outline-none focus:bg-blue-50"
                      >
                        <div className="font-medium">
                          {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name}
                        </div>
                        {patient.email && (
                          <div className="text-sm text-gray-600">{patient.email}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Prescription ID */}
          <div className="space-y-2">
            <Label htmlFor="prescription-id">ID de Prescripción</Label>
            <Input
              id="prescription-id"
              type="text"
              value={formData.prescription_id}
              onChange={(e) => setFormData({ ...formData, prescription_id: e.target.value })}
              placeholder="Ej: RX-2024-001234"
              required
            />
          </div>

          {/* Refill Date */}
          <div className="space-y-2">
            <Label htmlFor="refill-date">Fecha de Resurtido</Label>
            <Input
              id="refill-date"
              type="date"
              value={formData.refill_date}
              onChange={(e) => setFormData({ ...formData, refill_date: e.target.value })}
              required
            />
          </div>

          {/* Refill Type */}
          <div className="space-y-2">
            <Label>Tipo de Resurtido</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {refillTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = formData.refill_type === option.value;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, refill_type: option.value as any })}
                    className={cn(
                      "p-3 text-center rounded-lg border transition-all",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <IconComponent className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controlled Medication */}
          <div className="flex items-center space-x-3">
            <input
              id="controlled-medication"
              type="checkbox"
              checked={formData.is_controlled_medication}
              onChange={(e) => setFormData({ ...formData, is_controlled_medication: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="controlled-medication" className="text-sm font-medium">
                Medicamento Controlado
              </Label>
              {formData.is_controlled_medication && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  Controlado
                </Badge>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones adicionales sobre el resurtido..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !selectedPatient}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Registrar Resurtido
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>

          {/* Summary */}
          {selectedPatient && selectedRefillType && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Resumen del Resurtido</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Paciente:</strong> {selectedPatient.first_name} {selectedPatient.paternal_last_name}</p>
                <p><strong>Fecha:</strong> {new Date(formData.refill_date).toLocaleDateString()}</p>
                <p><strong>Tipo:</strong> {selectedRefillType.label}</p>
                {formData.is_controlled_medication && (
                  <p className="text-red-600 font-medium">⚠️ Medicamento controlado - requiere seguimiento especial</p>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}