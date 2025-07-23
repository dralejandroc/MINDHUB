'use client';

import { useState } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface BlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockData: any) => void;
}

export default function BlockTimeModal({ isOpen, onClose, onSave }: BlockTimeModalProps) {
  const [blockData, setBlockData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '20:00',
    allDay: false,
    reason: 'personal',
    notes: '',
    recurring: false,
    recurringType: 'weekly',
    recurringDays: [] as string[],
    recurringWeeks: 1,
    recurringEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const reasons = [
    { value: 'personal', label: 'Espacio Personal', color: 'blue', defaultAllDay: false },
    { value: 'vacation', label: 'Vacaciones', color: 'green', defaultAllDay: true },
    { value: 'congress', label: 'Congreso/Evento', color: 'purple', defaultAllDay: false },
    { value: 'holiday', label: 'Día Feriado', color: 'red', defaultAllDay: true },
    { value: 'lunch', label: 'Horario de Comida', color: 'orange', defaultAllDay: false },
    { value: 'course', label: 'Curso/Capacitación', color: 'indigo', defaultAllDay: false },
    { value: 'other', label: 'Otro', color: 'gray', defaultAllDay: false }
  ];

  // Función para manejar cambio de motivo y ajustar configuraciones automáticamente
  const handleReasonChange = (newReason: string) => {
    const reasonConfig = reasons.find(r => r.value === newReason);
    setBlockData({
      ...blockData,
      reason: newReason,
      allDay: reasonConfig?.defaultAllDay || false
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(blockData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Bloquear Horario</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de bloqueo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del bloqueo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => handleReasonChange(reason.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    blockData.reason === reason.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Fecha inicio
              </label>
              <input
                type="date"
                value={blockData.startDate}
                onChange={(e) => setBlockData({ ...blockData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Fecha fin
              </label>
              <input
                type="date"
                value={blockData.endDate}
                onChange={(e) => setBlockData({ ...blockData, endDate: e.target.value })}
                min={blockData.startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Día completo */}
          {!['vacation', 'holiday'].includes(blockData.reason) && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allDay"
                checked={blockData.allDay}
                onChange={(e) => setBlockData({ ...blockData, allDay: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allDay" className="ml-2 text-sm text-gray-700">
                Bloquear día completo
              </label>
            </div>
          )}

          {/* Recurrencia */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="recurring"
                checked={blockData.recurring}
                onChange={(e) => setBlockData({ ...blockData, recurring: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="recurring" className="ml-2 text-sm font-medium text-gray-700">
                Repetir bloqueo
              </label>
            </div>

            {blockData.recurring && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de repetición
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBlockData({ ...blockData, recurringType: 'daily' })}
                      className={`p-2 text-sm rounded border ${
                        blockData.recurringType === 'daily'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Diario
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockData({ ...blockData, recurringType: 'weekly' })}
                      className={`p-2 text-sm rounded border ${
                        blockData.recurringType === 'weekly'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Semanal
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockData({ ...blockData, recurringType: 'monthly' })}
                      className={`p-2 text-sm rounded border ${
                        blockData.recurringType === 'monthly'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Mensual
                    </button>
                  </div>
                </div>

                {blockData.recurringType === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de la semana
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={blockData.recurringDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBlockData({
                                  ...blockData,
                                  recurringDays: [...blockData.recurringDays, day]
                                });
                              } else {
                                setBlockData({
                                  ...blockData,
                                  recurringDays: blockData.recurringDays.filter(d => d !== day)
                                });
                              }
                            }}
                            className="h-3 w-3 mr-1"
                          />
                          <span className="text-sm">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración (semanas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={blockData.recurringWeeks}
                      onChange={(e) => setBlockData({ ...blockData, recurringWeeks: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta fecha
                    </label>
                    <input
                      type="date"
                      value={blockData.recurringEndDate}
                      onChange={(e) => setBlockData({ ...blockData, recurringEndDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Horarios */}
          {!blockData.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={blockData.startTime}
                  onChange={(e) => setBlockData({ ...blockData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!blockData.allDay}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  Hora fin
                </label>
                <input
                  type="time"
                  value={blockData.endTime}
                  onChange={(e) => setBlockData({ ...blockData, endTime: e.target.value })}
                  min={blockData.startTime}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!blockData.allDay}
                />
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={blockData.notes}
              onChange={(e) => setBlockData({ ...blockData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalles adicionales..."
            />
          </div>

          {/* Resumen */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📋 Resumen del bloqueo</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Motivo:</strong> {
                  blockData.reason === 'personal' ? 'Espacio Personal' : 
                  blockData.reason === 'vacation' ? 'Vacaciones' :
                  blockData.reason === 'congress' ? 'Congreso/Evento' :
                  blockData.reason === 'holiday' ? 'Día Feriado' :
                  blockData.reason === 'lunch' ? 'Horario de Comida' :
                  blockData.reason === 'course' ? 'Curso/Capacitación' : 'Otro'
                }
              </p>
              <p>
                <strong>Fechas:</strong> {new Date(blockData.startDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                })}
                {blockData.startDate !== blockData.endDate && 
                  ` hasta ${new Date(blockData.endDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })}`
                }
              </p>
              {!blockData.allDay && !['vacation', 'holiday'].includes(blockData.reason) && (
                <p>
                  <strong>Horario:</strong> {blockData.startTime} - {blockData.endTime}
                </p>
              )}
              {(blockData.allDay || ['vacation', 'holiday'].includes(blockData.reason)) && (
                <p>
                  <strong>Horario:</strong> Día completo
                </p>
              )}
              {blockData.recurring && (
                <p>
                  <strong>Repetición:</strong> {
                    blockData.recurringType === 'daily' ? 'Diario' :
                    blockData.recurringType === 'weekly' ? `Semanal (${blockData.recurringDays.join(', ')})` :
                    'Mensual'
                  } por {blockData.recurringWeeks} semana{blockData.recurringWeeks !== 1 ? 's' : ''}
                </p>
              )}
              {blockData.notes && (
                <p>
                  <strong>Notas:</strong> {blockData.notes}
                </p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              🚫 Bloquear Horario
            </Button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}