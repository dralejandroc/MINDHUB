'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CalendarIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Tooltip } from '@/components/ui/Tooltip';
import { toast } from 'react-hot-toast';

interface ScheduleSettings {
  workingHours: {
    start: string;
    end: string;
  };
  lunchBreak: {
    enabled: boolean;
    start: string;
    end: string;
  };
  workingDays: string[];
  defaultAppointmentDuration: number;
  consultationTypes: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    color: string;
  }>;
  blockedDates: string[];
  maxDailyAppointments: number;
  bufferTime: number;
  reminders: {
    whatsapp: {
      enabled: boolean;
      template: string;
      hoursBeforeAppointment: number;
    };
    email: {
      enabled: boolean;
      template: string;
      hoursBeforeAppointment: number;
    };
  };
}

export function AgendaConfigurationSettings() {
  const [settings, setSettings] = useState<ScheduleSettings>({
    workingHours: {
      start: '08:00',
      end: '20:00'
    },
    lunchBreak: {
      enabled: true,
      start: '14:00',
      end: '15:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    defaultAppointmentDuration: 60,
    consultationTypes: [
      { id: '1', name: 'Consulta inicial', duration: 90, price: 1500, color: 'bg-blue-500' },
      { id: '2', name: 'Seguimiento', duration: 60, price: 1200, color: 'bg-green-500' },
      { id: '3', name: 'Evaluación psicológica', duration: 120, price: 2000, color: 'bg-purple-500' },
      { id: '4', name: 'Terapia individual', duration: 60, price: 1000, color: 'bg-orange-500' },
      { id: '5', name: 'Control de medicación', duration: 30, price: 800, color: 'bg-red-500' }
    ],
    blockedDates: [],
    maxDailyAppointments: 20,
    bufferTime: 15,
    reminders: {
      whatsapp: {
        enabled: true,
        template: "Hola {PATIENT_NAME}, te recordamos tu cita con {PROFESSIONAL_NAME} el {DATE} a las {TIME} en {CLINIC_NAME}. Ubicado en {CLINIC_ADDRESS}. Si necesitas reprogramar, contacta al {CLINIC_PHONE}.",
        hoursBeforeAppointment: 24
      },
      email: {
        enabled: true,
        template: "Estimado/a {PATIENT_NAME},\n\nEste es un recordatorio de su cita médica:\n\nFecha: {DATE}\nHora: {TIME}\nProfesional: {PROFESSIONAL_NAME}\nTipo de consulta: {APPOINTMENT_TYPE}\n\nDirección: {CLINIC_NAME}\n{CLINIC_ADDRESS}\nTeléfono: {CLINIC_PHONE}\n\nPor favor llegue 15 minutos antes de su cita.\n\nSi necesita reprogramar o cancelar, contacte con nosotros al menos 24 horas antes.\n\nSaludos cordiales,\nEquipo de {CLINIC_NAME}",
        hoursBeforeAppointment: 24
      }
    }
  });

  const [newConsultationType, setNewConsultationType] = useState({
    name: '',
    duration: 60,
    price: 1000,
    color: 'bg-blue-500'
  });

  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editingTypeData, setEditingTypeData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const weekDays = [
    { id: 'monday', label: 'Lunes', short: 'L' },
    { id: 'tuesday', label: 'Martes', short: 'M' },
    { id: 'wednesday', label: 'Miércoles', short: 'X' },
    { id: 'thursday', label: 'Jueves', short: 'J' },
    { id: 'friday', label: 'Viernes', short: 'V' },
    { id: 'saturday', label: 'Sábado', short: 'S' },
    { id: 'sunday', label: 'Domingo', short: 'D' }
  ];

  const colorOptions = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500'
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/expedix/schedule-config`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Loaded agenda settings from API:', data);
        if (data.success && data.data) {
          // Merge with default structure to ensure all properties exist
          const loadedData = {
            ...settings, // Use current defaults as base
            ...data.data, // Override with loaded data
            reminders: {
              whatsapp: {
                enabled: data.data.reminders?.whatsapp?.enabled || false,
                template: data.data.reminders?.whatsapp?.template || "Hola {PATIENT_NAME}, te recordamos tu cita con {PROFESSIONAL_NAME} el {DATE} a las {TIME} en {CLINIC_NAME}. Ubicado en {CLINIC_ADDRESS}. Si necesitas reprogramar, contacta al {CLINIC_PHONE}.",
                hoursBeforeAppointment: data.data.reminders?.whatsapp?.hoursBeforeAppointment || 24
              },
              email: {
                enabled: data.data.reminders?.email?.enabled || false,
                template: data.data.reminders?.email?.template || "Estimado/a {PATIENT_NAME},\n\nEste es un recordatorio de su cita médica:\n\nFecha: {DATE}\nHora: {TIME}\nProfesional: {PROFESSIONAL_NAME}\nTipo de consulta: {APPOINTMENT_TYPE}\n\nDirección: {CLINIC_NAME}\n{CLINIC_ADDRESS}\nTeléfono: {CLINIC_PHONE}\n\nPor favor llegue 15 minutos antes de su cita.\n\nSi necesita reprogramar o cancelar, contacte con nosotros al menos 24 horas antes.\n\nSaludos cordiales,\nEquipo de {CLINIC_NAME}",
                hoursBeforeAppointment: data.data.reminders?.email?.hoursBeforeAppointment || 24
              }
            }
          };
          setSettings(loadedData);
        }
      }
    } catch (error) {
      console.log('Could not load agenda settings, using defaults:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      console.log('💾 Saving agenda settings:', settings);
      const response = await fetch(`/api/expedix/schedule-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      console.log('📡 Save response:', data);

      if (response.ok && data.success) {
        toast.success('Configuración de agenda guardada exitosamente');
      } else {
        console.error('Save failed:', data);
        toast.error(`Error al guardar la configuración: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving agenda settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkingDay = (dayId: string) => {
    setSettings(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayId)
        ? prev.workingDays.filter(d => d !== dayId)
        : [...prev.workingDays, dayId]
    }));
  };

  const addConsultationType = () => {
    if (!newConsultationType.name) return;

    const newType = {
      id: Date.now().toString(),
      ...newConsultationType
    };

    setSettings(prev => ({
      ...prev,
      consultationTypes: [...prev.consultationTypes, newType]
    }));

    setNewConsultationType({
      name: '',
      duration: 60,
      price: 1000,
      color: 'bg-blue-500'
    });
    setShowNewTypeForm(false);
  };

  const removeConsultationType = (id: string) => {
    setSettings(prev => ({
      ...prev,
      consultationTypes: prev.consultationTypes.filter(t => t.id !== id)
    }));
  };

  const startEditingType = (type: any) => {
    setEditingType(type.id);
    setEditingTypeData({ ...type });
  };

  const saveEditingType = () => {
    if (!editingTypeData) return;

    setSettings(prev => ({
      ...prev,
      consultationTypes: prev.consultationTypes.map(t => 
        t.id === editingType ? editingTypeData : t
      )
    }));

    setEditingType(null);
    setEditingTypeData(null);
  };

  const cancelEditingType = () => {
    setEditingType(null);
    setEditingTypeData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Configuración de Agenda</h2>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Horario de Trabajo */}
        <Card className="p-6 hover-lift">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-green">Horario de Trabajo</h3>
            <Tooltip 
              content="Define las horas en que estarás disponible para consultas. Las citas solo se podrán agendar dentro de este horario."
              className="ml-2"
            />
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={settings.workingHours.start}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={settings.workingHours.end}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Horario de Comida */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-700">
                    Horario de comida
                  </label>
                  <Tooltip 
                    content="Bloquea automáticamente un período para comida. Durante este tiempo no se podrán agendar citas."
                    className="ml-1"
                  />
                </div>
                <input
                  type="checkbox"
                  checked={settings.lunchBreak.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    lunchBreak: { ...prev.lunchBreak, enabled: e.target.checked }
                  }))}
                  className="h-4 w-4 text-orange-600 rounded"
                />
              </div>
              
              {settings.lunchBreak.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Inicio
                    </label>
                    <input
                      type="time"
                      value={settings.lunchBreak.start}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        lunchBreak: { ...prev.lunchBreak, start: e.target.value }
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fin
                    </label>
                    <input
                      type="time"
                      value={settings.lunchBreak.end}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        lunchBreak: { ...prev.lunchBreak, end: e.target.value }
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Días Laborables */}
        <Card className="p-6 hover-lift">
          <div className="flex items-center mb-4">
            <CalendarDaysIcon className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-green">Días Laborables</h3>
            <Tooltip 
              content="Selecciona los días de la semana en que trabajas. Los días seleccionados aparecen con fondo naranja y checkmark."
              className="ml-2"
            />
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <button
                key={day.id}
                onClick={() => toggleWorkingDay(day.id)}
                className={`p-3 rounded-lg text-center transition-all duration-200 relative ${
                  settings.workingDays.includes(day.id)
                    ? 'bg-orange-500 text-white border-2 border-orange-600 shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-500 border-2 border-gray-200 hover:bg-gray-200'
                }`}
                title={`${day.label} - ${settings.workingDays.includes(day.id) ? 'ACTIVO' : 'Inactivo'}`}
              >
                <div className="text-xs font-bold">{day.short}</div>
                {settings.workingDays.includes(day.id) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
                    <CheckCircleIcon className="h-2 w-2 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Duración por defecto (min)
                </label>
                <Tooltip 
                  content="Duración predeterminada para nuevas citas cuando no se especifica un tipo de consulta."
                  className="ml-1"
                />
              </div>
              <input
                type="number"
                value={settings.defaultAppointmentDuration}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  defaultAppointmentDuration: parseInt(e.target.value) || 60
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                min="15"
                max="240"
                step="15"
              />
            </div>
            <div>
              <div className="flex items-center mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Tiempo buffer (min)
                </label>
                <Tooltip 
                  content="Tiempo adicional entre citas para preparación, limpieza, y notas. Ayuda a evitar retrasos en la agenda."
                  className="ml-1"
                />
              </div>
              <input
                type="number"
                value={settings.bufferTime}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bufferTime: parseInt(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                min="0"
                max="60"
                step="5"
              />
            </div>
          </div>
        </Card>

        {/* Tipos de Consulta */}
        <Card className="p-6 hover-lift lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-dark-green">Tipos de Consulta</h3>
              <Tooltip 
                content="Define los diferentes tipos de consulta con sus duraciones, precios y colores. Haz clic en cualquier tipo para editarlo."
                className="ml-2"
              />
            </div>
            <Button
              onClick={() => setShowNewTypeForm(true)}
              variant="outline"
              size="sm"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Agregar Tipo
            </Button>
          </div>

          {showNewTypeForm && (
            <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={newConsultationType.name}
                    onChange={(e) => setNewConsultationType(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="Ej: Consulta de control"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    value={newConsultationType.duration}
                    onChange={(e) => setNewConsultationType(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    min="15"
                    max="240"
                    step="15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Precio
                  </label>
                  <input
                    type="number"
                    value={newConsultationType.price}
                    onChange={(e) => setNewConsultationType(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-1">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewConsultationType(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded ${color} ${
                          newConsultationType.color === color ? 'ring-2 ring-offset-2 ring-gray-500' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-3 space-x-2">
                <Button
                  onClick={() => setShowNewTypeForm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addConsultationType}
                  variant="primary"
                  size="sm"
                  disabled={!newConsultationType.name}
                >
                  Agregar
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {settings.consultationTypes.map(type => (
              <div key={type.id}>
                {editingType === type.id ? (
                  // Edit form for existing type
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editingTypeData?.name || ''}
                          onChange={(e) => setEditingTypeData((prev: any) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          placeholder="Ej: Consulta de control"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Duración (min)
                        </label>
                        <input
                          type="number"
                          value={editingTypeData?.duration || 60}
                          onChange={(e) => setEditingTypeData((prev: any) => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          min="15"
                          max="240"
                          step="15"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio
                        </label>
                        <input
                          type="number"
                          value={editingTypeData?.price || 0}
                          onChange={(e) => setEditingTypeData((prev: any) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          min="0"
                          step="100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <div className="flex items-center space-x-1">
                          {colorOptions.map(color => (
                            <button
                              key={color}
                              onClick={() => setEditingTypeData((prev: any) => ({ ...prev, color }))}
                              className={`w-8 h-8 rounded ${color} ${
                                editingTypeData?.color === color ? 'ring-2 ring-offset-2 ring-gray-500' : ''
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3 space-x-2">
                      <Button
                        onClick={cancelEditingType}
                        variant="outline"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={saveEditingType}
                        variant="primary"
                        size="sm"
                        disabled={!editingTypeData?.name}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode - clickable to edit
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => startEditingType(type)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${type.color}`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        <div className="text-xs text-gray-600">
                          {type.duration} min • ${type.price}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PencilIcon className="h-4 w-4 text-gray-400" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeConsultationType(type.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Límites y Restricciones */}
        <Card className="p-6 hover-lift">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-green">Límites y Restricciones</h3>
            <Tooltip 
              content="Establece límites diarios para evitar sobrecarga de trabajo y mantener calidad en la atención."
              className="ml-2"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Máximo de citas diarias
                </label>
                <Tooltip 
                  content="Número máximo de citas que puedes tener en un día. Ayuda a prevenir agotamiento y mantener calidad de atención."
                  className="ml-1"
                />
              </div>
              <input
                type="number"
                value={settings.maxDailyAppointments}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxDailyAppointments: parseInt(e.target.value) || 20
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                min="1"
                max="100"
              />
            </div>
          </div>
        </Card>

        {/* Configuración de Recordatorios */}
        <Card className="p-6 hover-lift">
          <div className="flex items-center mb-4">
            <CalendarIcon className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-green">Recordatorios de Citas</h3>
            <Tooltip 
              content="Configura mensajes automáticos de recordatorio que se enviarán a los pacientes antes de sus citas."
              className="ml-2"
            />
          </div>

          {/* WhatsApp Reminders */}
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                  <label className="text-sm font-medium text-gray-700">
                    Recordatorios por WhatsApp
                  </label>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminders.whatsapp.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    reminders: {
                      ...prev.reminders,
                      whatsapp: { ...prev.reminders.whatsapp, enabled: e.target.checked }
                    }
                  }))}
                  className="h-4 w-4 text-orange-600 rounded"
                />
              </div>
              
              {settings.reminders.whatsapp.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Enviar recordatorio (horas antes de la cita)
                    </label>
                    <select
                      value={settings.reminders.whatsapp.hoursBeforeAppointment}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        reminders: {
                          ...prev.reminders,
                          whatsapp: { ...prev.reminders.whatsapp, hoursBeforeAppointment: parseInt(e.target.value) }
                        }
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={1}>1 hora antes</option>
                      <option value={2}>2 horas antes</option>
                      <option value={6}>6 horas antes</option>
                      <option value={24}>24 horas antes</option>
                      <option value={48}>48 horas antes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Plantilla de mensaje
                    </label>
                    <textarea
                      value={settings.reminders.whatsapp.template}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        reminders: {
                          ...prev.reminders,
                          whatsapp: { ...prev.reminders.whatsapp, template: e.target.value }
                        }
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Escribe el mensaje que se enviará..."
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Variables disponibles: {'{PATIENT_NAME}'}, {'{PROFESSIONAL_NAME}'}, {'{DATE}'}, {'{TIME}'}, {'{CLINIC_NAME}'}, {'{CLINIC_ADDRESS}'}, {'{CLINIC_PHONE}'}, {'{APPOINTMENT_TYPE}'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Email Reminders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">@</span>
                  </div>
                  <label className="text-sm font-medium text-gray-700">
                    Recordatorios por Email
                  </label>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminders.email.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    reminders: {
                      ...prev.reminders,
                      email: { ...prev.reminders.email, enabled: e.target.checked }
                    }
                  }))}
                  className="h-4 w-4 text-orange-600 rounded"
                />
              </div>
              
              {settings.reminders.email.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Enviar recordatorio (horas antes de la cita)
                    </label>
                    <select
                      value={settings.reminders.email.hoursBeforeAppointment}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        reminders: {
                          ...prev.reminders,
                          email: { ...prev.reminders.email, hoursBeforeAppointment: parseInt(e.target.value) }
                        }
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={1}>1 hora antes</option>
                      <option value={2}>2 horas antes</option>
                      <option value={6}>6 horas antes</option>
                      <option value={24}>24 horas antes</option>
                      <option value={48}>48 horas antes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Plantilla de email
                    </label>
                    <textarea
                      value={settings.reminders.email.template}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        reminders: {
                          ...prev.reminders,
                          email: { ...prev.reminders.email, template: e.target.value }
                        }
                      }))}
                      rows={8}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Escribe el email que se enviará..."
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Variables disponibles: {'{PATIENT_NAME}'}, {'{PROFESSIONAL_NAME}'}, {'{DATE}'}, {'{TIME}'}, {'{CLINIC_NAME}'}, {'{CLINIC_ADDRESS}'}, {'{CLINIC_PHONE}'}, {'{APPOINTMENT_TYPE}'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}