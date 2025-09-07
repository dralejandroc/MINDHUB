'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  PlusIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface MedicationRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  dosage_forms: string;
  concentration: string;
  laboratory: string;
  active_principle: string;
  contraindications?: string;
  side_effects?: string;
  created_at?: string;
  updated_at?: string;
}

interface MedicationDatabaseManagerProps {
  onMedicationSelect?: (medication: MedicationRecord) => void;
  isSelectionMode?: boolean;
}

export function MedicationDatabaseManager({ onMedicationSelect, isSelectionMode = false }: MedicationDatabaseManagerProps) {
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<MedicationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newMedication, setNewMedication] = useState<Partial<MedicationRecord>>({
    name: '',
    description: '',
    category: '',
    dosage_forms: '',
    concentration: '',
    laboratory: '',
    active_principle: '',
    contraindications: '',
    side_effects: ''
  });

  // Plantilla para importación
  const MEDICATION_TEMPLATE = [
    {
      nombre: 'PARACETAMOL',
      descripcion: 'gotas orales en solución 100 mg/ml',
      categoria: 'ANALGÉSICOS',
      formas_dosificacion: 'Gotas orales',
      concentracion: '100 mg/ml',
      laboratorio: 'PRODUCTOS MAVER, S.A. DE C.V.',
      principio_activo: 'Paracetamol',
      contraindicaciones: 'Hipersensibilidad al paracetamol',
      efectos_secundarios: 'Raramente: erupciones cutáneas, náuseas'
    },
    {
      nombre: 'AVELOX',
      descripcion: 'Comprimidos recubiertos 400 mg',
      categoria: 'ANTIBIÓTICOS',
      formas_dosificacion: 'Comprimidos',
      concentracion: '400 mg',
      laboratorio: 'BAYER HEALTHCARE',
      principio_activo: 'Moxifloxacino',
      contraindicaciones: 'Embarazo, lactancia, menores de 18 años',
      efectos_secundarios: 'Náuseas, diarrea, mareos, dolor de cabeza'
    }
  ];

  React.useEffect(() => {
    loadMedications();
  }, []);

  React.useEffect(() => {
    if (searchTerm) {
      const filtered = medications.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.laboratory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.active_principle.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedications(filtered);
    } else {
      setFilteredMedications(medications);
    }
  }, [searchTerm, medications]);

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      // Simulamos carga desde localStorage o API
      const storedMedications = localStorage.getItem('mindhub_medications');
      if (storedMedications) {
        const parsed = JSON.parse(storedMedications);
        setMedications(parsed);
        setFilteredMedications(parsed);
      } else {
        // Cargar medicamentos por defecto
        const defaultMedications = [
          {
            id: '1',
            name: 'PARACETAMOL',
            description: 'gotas orales en solución 100 mg/ml',
            category: 'ANALGÉSICOS',
            dosage_forms: 'Gotas orales',
            concentration: '100 mg/ml',
            laboratory: 'PRODUCTOS MAVER, S.A. DE C.V.',
            active_principle: 'Paracetamol'
          },
          {
            id: '2',
            name: 'AVELOX',
            description: 'Comprimidos recubiertos 400 mg',
            category: 'ANTIBIÓTICOS',
            dosage_forms: 'Comprimidos',
            concentration: '400 mg',
            laboratory: 'BAYER HEALTHCARE',
            active_principle: 'Moxifloxacino'
          }
        ];
        setMedications(defaultMedications);
        setFilteredMedications(defaultMedications);
        localStorage.setItem('mindhub_medications', JSON.stringify(defaultMedications));
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      toast.error('Error al cargar medicamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMedication = async () => {
    if (!newMedication.name || !newMedication.laboratory) {
      toast.error('Nombre y laboratorio son requeridos');
      return;
    }

    try {
      const medicationToSave: MedicationRecord = {
        id: editingMedication?.id || Date.now().toString(),
        name: newMedication.name || '',
        description: newMedication.description || '',
        category: newMedication.category || '',
        dosage_forms: newMedication.dosage_forms || '',
        concentration: newMedication.concentration || '',
        laboratory: newMedication.laboratory || '',
        active_principle: newMedication.active_principle || '',
        contraindications: newMedication.contraindications,
        side_effects: newMedication.side_effects,
        created_at: editingMedication?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let updatedMedications;
      if (editingMedication) {
        updatedMedications = medications.map(med => 
          med.id === editingMedication.id ? medicationToSave : med
        );
      } else {
        updatedMedications = [...medications, medicationToSave];
      }

      setMedications(updatedMedications);
      localStorage.setItem('mindhub_medications', JSON.stringify(updatedMedications));
      
      resetForm();
      toast.success(editingMedication ? 'Medicamento actualizado' : 'Medicamento agregado');
    } catch (error) {
      console.error('Error saving medication:', error);
      toast.error('Error al guardar medicamento');
    }
  };

  const deleteMedication = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este medicamento?')) {
      const updatedMedications = medications.filter(med => med.id !== id);
      setMedications(updatedMedications);
      localStorage.setItem('mindhub_medications', JSON.stringify(updatedMedications));
      toast.success('Medicamento eliminado');
    }
  };

  const editMedication = (medication: MedicationRecord) => {
    setNewMedication(medication);
    setEditingMedication(medication);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewMedication({
      name: '',
      description: '',
      category: '',
      dosage_forms: '',
      concentration: '',
      laboratory: '',
      active_principle: '',
      contraindications: '',
      side_effects: ''
    });
    setEditingMedication(null);
    setShowAddForm(false);
  };

  const downloadTemplate = () => {
    const csvContent = [
      'nombre,descripcion,categoria,formas_dosificacion,concentracion,laboratorio,principio_activo,contraindicaciones,efectos_secundarios',
      ...MEDICATION_TEMPLATE.map(med => 
        `"${med.nombre}","${med.descripcion}","${med.categoria}","${med.formas_dosificacion}","${med.concentracion}","${med.laboratorio}","${med.principio_activo}","${med.contraindicaciones}","${med.efectos_secundarios}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_medicamentos_mindhub.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Plantilla descargada');
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor seleccione un archivo CSV');
      return;
    }

    try {
      setIsLoading(true);
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      if (!headers.includes('nombre') || !headers.includes('laboratorio')) {
        toast.error('El archivo debe contener al menos las columnas "nombre" y "laboratorio"');
        return;
      }

      const importedMedications: MedicationRecord[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const medication: MedicationRecord = {
          id: Date.now().toString() + i,
          name: values[headers.indexOf('nombre')] || '',
          description: values[headers.indexOf('descripcion')] || '',
          category: values[headers.indexOf('categoria')] || '',
          dosage_forms: values[headers.indexOf('formas_dosificacion')] || '',
          concentration: values[headers.indexOf('concentracion')] || '',
          laboratory: values[headers.indexOf('laboratorio')] || '',
          active_principle: values[headers.indexOf('principio_activo')] || '',
          contraindications: values[headers.indexOf('contraindicaciones')],
          side_effects: values[headers.indexOf('efectos_secundarios')],
          created_at: new Date().toISOString()
        };

        if (medication.name && medication.laboratory) {
          importedMedications.push(medication);
        }
      }

      if (importedMedications.length > 0) {
        const updatedMedications = [...medications, ...importedMedications];
        setMedications(updatedMedications);
        localStorage.setItem('mindhub_medications', JSON.stringify(updatedMedications));
        toast.success(`${importedMedications.length} medicamentos importados exitosamente`);
        setShowImportModal(false);
      } else {
        toast.error('No se encontraron medicamentos válidos en el archivo');
      }
    } catch (error) {
      console.error('Error importing medications:', error);
      toast.error('Error al importar medicamentos');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">💊 Base de Datos de Medicamentos</h2>
          <p className="text-sm text-gray-600">Gestiona tu catálogo de medicamentos para prescripciones</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportModal(true)}
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
            Importar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Nuevo Medicamento
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, descripción, laboratorio o principio activo..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              {editingMedication ? 'Editar Medicamento' : 'Nuevo Medicamento'}
            </h3>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Medicamento *
              </label>
              <input
                type="text"
                value={newMedication.name || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="PARACETAMOL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laboratorio *
              </label>
              <input
                type="text"
                value={newMedication.laboratory || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, laboratory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="PRODUCTOS MAVER, S.A. DE C.V."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={newMedication.category || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="ANALGÉSICOS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principio Activo
              </label>
              <input
                type="text"
                value={newMedication.active_principle || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, active_principle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="Paracetamol"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concentración
              </label>
              <input
                type="text"
                value={newMedication.concentration || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, concentration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="100 mg/ml"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formas de Dosificación
              </label>
              <input
                type="text"
                value={newMedication.dosage_forms || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage_forms: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="Gotas orales, Comprimidos"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={newMedication.description || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="gotas orales en solución 100 mg/ml"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraindicaciones
              </label>
              <textarea
                value={newMedication.contraindications || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, contraindications: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="Hipersensibilidad al principio activo..."
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Efectos Secundarios
              </label>
              <textarea
                value={newMedication.side_effects || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, side_effects: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder="Náuseas, mareos, erupciones cutáneas..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={saveMedication}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              {editingMedication ? 'Actualizar' : 'Guardar'} Medicamento
            </Button>
          </div>
        </Card>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Importar Medicamentos</h3>
                <Button variant="outline" size="sm" onClick={() => setShowImportModal(false)}>
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Importante:</p>
                      <p>Descarga la plantilla CSV y complétala con tus medicamentos antes de importar.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="flex items-center"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Descargar Plantilla CSV
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar archivo CSV
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>

                <div className="text-xs text-gray-500">
                  <p><strong>Formato requerido:</strong> CSV con las columnas:</p>
                  <p>nombre, descripcion, categoria, formas_dosificacion, concentracion, laboratorio, principio_activo, contraindicaciones, efectos_secundarios</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Medications List */}
      <Card className="p-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-gray-500">Cargando medicamentos...</div>
            </div>
          ) : filteredMedications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron medicamentos</p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMedications.map((medication) => (
                <div key={medication.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{medication.name}</h4>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {medication.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{medication.description}</p>
                      <p className="text-xs text-gray-600">
                        <strong>Lab:</strong> {medication.laboratory} | 
                        <strong> Principio:</strong> {medication.active_principle} | 
                        <strong> Concentración:</strong> {medication.concentration}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      {isSelectionMode && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onMedicationSelect?.(medication)}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          Seleccionar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editMedication(medication)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMedication(medication.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}