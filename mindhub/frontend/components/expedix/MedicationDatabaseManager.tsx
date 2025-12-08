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
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// ✅ MEDICAMENTO - Base de datos corregida con campos específicos
interface MedicationRecord {
  id: string;
  // Campos principales según especificación
  molecula_sustancia_activa: string;       // ej: "Paracetamol"
  nombres_comerciales: string[];           // ej: ["Tempra", "Tylenol", "Panadol"]  
  presentacion: string;                    // ej: "tabletas", "solución oral", "cápsulas"
  dosificacion: string;                    // ej: "500 mg"
  grupo_control: 'GII' | 'GIII' | 'GIV';  // Control regulatorio
  empaque?: string;                        // ej: "Caja con 20 tabletas" (opcional)
  
  // Campos adicionales del sistema actual (mantener compatibilidad)
  laboratorio?: string;
  categoria?: string;
  created_at?: string;
  updated_at?: string;
}

interface MedicationDatabaseManagerProps {
  onMedicationSelect?: (medication: MedicationRecord) => void;
  isSelectionMode?: boolean;
}

// Grupos de control según normativa
const CONTROL_GROUPS = [
  { value: 'GII', label: 'GII - Controlado', color: 'red' },
  { value: 'GIII', label: 'GIII - Semicontrolado', color: 'yellow' },
  { value: 'GIV', label: 'GIV - No controlado', color: 'green' }
];

const PRESENTACIONES = [
  'tabletas', 'cápsulas', 'grageas', 'solución oral', 'suspensión oral',
  'jarabe', 'gotas orales', 'liberación prolongada', 'comprimidos',
  'sobres', 'ampolletas', 'viales'
];

export function MedicationDatabaseManager({ onMedicationSelect, isSelectionMode = false }: MedicationDatabaseManagerProps) {
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<MedicationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newMedication, setNewMedication] = useState<Partial<MedicationRecord>>({
    molecula_sustancia_activa: '',
    nombres_comerciales: [''],
    presentacion: '',
    dosificacion: '',
    grupo_control: 'GIV',
    empaque: '',
    laboratorio: '',
    categoria: ''
  });

  // Plantilla de ejemplo con estructura correcta
  const MEDICATION_TEMPLATE = [
    {
      molecula_sustancia_activa: 'Paracetamol',
      nombres_comerciales: ['Tempra', 'Tylenol', 'Panadol'],
      presentacion: 'tabletas',
      dosificacion: '500 mg',
      grupo_control: 'GIV',
      empaque: 'Caja con 20 tabletas',
      laboratorio: 'Laboratorios Liomont',
      categoria: 'Analgésicos'
    },
    {
      molecula_sustancia_activa: 'Moxifloxacino', 
      nombres_comerciales: ['Avelox'],
      presentacion: 'comprimidos',
      dosificacion: '400 mg',
      grupo_control: 'GIII',
      empaque: 'Caja con 5 comprimidos',
      laboratorio: 'Bayer Healthcare',
      categoria: 'Antibióticos'
    },
    {
      molecula_sustancia_activa: 'Clonazepam',
      nombres_comerciales: ['Rivotril', 'Klonopin'],
      presentacion: 'tabletas',
      dosificacion: '2 mg',
      grupo_control: 'GII',
      empaque: 'Caja con 30 tabletas',
      laboratorio: 'Roche',
      categoria: 'Psicotrópicos'
    }
  ];

  React.useEffect(() => {
    loadMedications();
  }, []);

  React.useEffect(() => {
    if (searchTerm) {
      const filtered = medications.filter(med =>
        med.molecula_sustancia_activa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.nombres_comerciales.some(nombre => 
          nombre.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (med.laboratorio && med.laboratorio.toLowerCase().includes(searchTerm.toLowerCase())) ||
        med.presentacion.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedications(filtered);
    } else {
      setFilteredMedications(medications);
    }
  }, [searchTerm, medications]);

  const loadMedications = () => {
    try {
      const savedMedications = localStorage.getItem('mindhub_medications_database');
      if (savedMedications) {
        const parsed = JSON.parse(savedMedications);
        setMedications(parsed);
        setFilteredMedications(parsed);
      } else {
        // Cargar datos de ejemplo si no hay datos guardados
        const exampleData = MEDICATION_TEMPLATE.map((med, index) => ({
          ...med,
          id: `example_${index}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setMedications(exampleData);
        setFilteredMedications(exampleData);
        localStorage.setItem('mindhub_medications_database', JSON.stringify(exampleData));
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      toast.error('Error al cargar la base de datos');
    }
  };

  const saveMedications = (updatedMedications: MedicationRecord[]) => {
    try {
      localStorage.setItem('mindhub_medications_database', JSON.stringify(updatedMedications));
      setMedications(updatedMedications);
      setFilteredMedications(updatedMedications);
      toast.success('Base de datos actualizada');
    } catch (error) {
      console.error('Error saving medications:', error);
      toast.error('Error al guardar la base de datos');
    }
  };

  const addMedication = () => {
    if (!newMedication.molecula_sustancia_activa || 
        !newMedication.nombres_comerciales?.some(nombre => nombre.trim())) {
      toast.error('Molécula y al menos un nombre comercial son obligatorios');
      return;
    }

    const medication: MedicationRecord = {
      ...newMedication as MedicationRecord,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedMedications = [...medications, medication];
    saveMedications(updatedMedications);
    
    // Reset form
    setNewMedication({
      molecula_sustancia_activa: '',
      nombres_comerciales: [''],
      presentacion: '',
      dosificacion: '',
      grupo_control: 'GIV',
      empaque: '',
      laboratorio: '',
      categoria: ''
    });
    setShowAddForm(false);
  };

  const updateMedication = (updatedMed: MedicationRecord) => {
    const updatedMedications = medications.map(med => 
      med.id === updatedMed.id 
        ? { ...updatedMed, updated_at: new Date().toISOString() }
        : med
    );
    saveMedications(updatedMedications);
    setEditingMedication(null);
  };

  const deleteMedication = (id: string) => {
    if (window.confirm('¿Confirmar eliminación del medicamento?')) {
      const updatedMedications = medications.filter(med => med.id !== id);
      saveMedications(updatedMedications);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(medications, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicamentos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getControlGroupBadge = (grupo: string) => {
    const groupInfo = CONTROL_GROUPS.find(g => g.value === grupo);
    if (!groupInfo) return null;
    
    const colorClasses = {
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium border rounded ${colorClasses[groupInfo.color as keyof typeof colorClasses]}`}>
        {groupInfo.label}
      </span>
    );
  };

  const addNombreComercial = () => {
    setNewMedication(prev => ({
      ...prev,
      nombres_comerciales: [...(prev.nombres_comerciales || []), '']
    }));
  };

  const updateNombreComercial = (index: number, value: string) => {
    setNewMedication(prev => ({
      ...prev,
      nombres_comerciales: prev.nombres_comerciales?.map((nombre, i) => 
        i === index ? value : nombre
      ) || []
    }));
  };

  const removeNombreComercial = (index: number) => {
    setNewMedication(prev => ({
      ...prev,
      nombres_comerciales: prev.nombres_comerciales?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 Base de Datos de Medicamentos</h1>
          <p className="text-gray-600 mt-1">Información farmacológica técnica únicamente</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={exportData}
            disabled={medications.length === 0}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Medicamento
          </Button>
        </div>
      </div>

      {/* Important Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">📋 Base de Datos de MEDICAMENTOS (Información Farmacológica)</p>
            <p>Esta base contiene únicamente datos técnicos del medicamento. Las <strong>indicaciones de uso</strong> (dosis, frecuencia, duración) se manejan por separado.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por molécula, nombre comercial, laboratorio..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{medications.length}</div>
          <div className="text-sm text-gray-600">Total Medicamentos</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {medications.filter(m => m.grupo_control === 'GII').length}
          </div>
          <div className="text-sm text-gray-600">Controlados (GII)</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {medications.filter(m => m.grupo_control === 'GIII').length}
          </div>
          <div className="text-sm text-gray-600">Semicontrolados (GIII)</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {medications.filter(m => m.grupo_control === 'GIV').length}
          </div>
          <div className="text-sm text-gray-600">No controlados (GIV)</div>
        </Card>
      </div>

      {/* Medications Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Molécula/Sustancia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombres Comerciales
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Presentación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosificación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Control
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empaque
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedications.map((medication) => (
                <tr key={medication.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">
                      {medication.molecula_sustancia_activa}
                    </div>
                    {medication.laboratorio && (
                      <div className="text-sm text-gray-500">{medication.laboratorio}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {medication.nombres_comerciales.map((nombre, index) => (
                        <div key={index} className="text-sm font-medium text-blue-600">
                          {nombre}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {medication.presentacion}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {medication.dosificacion}
                  </td>
                  <td className="px-4 py-4">
                    {getControlGroupBadge(medication.grupo_control)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {medication.empaque || '-'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {isSelectionMode ? (
                        <Button
                          size="sm"
                          onClick={() => onMedicationSelect?.(medication)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMedication(medication)}
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMedications.length === 0 && (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron medicamentos</p>
            </div>
          )}
        </div>
      </Card>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Agregar Nuevo Medicamento</h2>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Molécula/Sustancia Activa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🧪 Molécula/Sustancia Activa *
                  </label>
                  <input
                    type="text"
                    value={newMedication.molecula_sustancia_activa || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, molecula_sustancia_activa: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ej: Paracetamol"
                    required
                  />
                </div>

                {/* Presentación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💊 Presentación *
                  </label>
                  <select
                    value={newMedication.presentacion || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, presentacion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar presentación</option>
                    {PRESENTACIONES.map((pres, index) => (
                      <option key={index} value={pres}>{pres}</option>
                    ))}
                  </select>
                </div>

                {/* Dosificación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚖️ Dosificación *
                  </label>
                  <input
                    type="text"
                    value={newMedication.dosificacion || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, dosificacion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ej: 500 mg"
                    required
                  />
                </div>

                {/* Grupo de Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔒 Grupo de Control *
                  </label>
                  <select
                    value={newMedication.grupo_control || 'GIV'}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, grupo_control: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {CONTROL_GROUPS.map((grupo, index) => (
                      <option key={index} value={grupo.value}>
                        {grupo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Empaque */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📦 Empaque (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newMedication.empaque || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, empaque: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ej: Caja con 20 tabletas"
                  />
                </div>

                {/* Laboratorio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏭 Laboratorio (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newMedication.laboratorio || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, laboratorio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ej: Bayer Healthcare"
                  />
                </div>
              </div>

              {/* Nombres Comerciales */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    🏷️ Nombre(s) Comercial(es) *
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addNombreComercial}
                    className="text-xs"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                </div>
                <div className="space-y-2">
                  {(newMedication.nombres_comerciales || ['']).map((nombre, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => updateNombreComercial(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Nombre comercial ${index + 1}`}
                        required={index === 0}
                      />
                      {(newMedication.nombres_comerciales?.length || 0) > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeNombreComercial(index)}
                          className="text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={addMedication}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Agregar Medicamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}