'use client';

import React, { useState } from 'react';
import { Exercise } from '@/types/psychoeducational-documents';
import { 
  PencilSquareIcon, 
  TableCellsIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface DocumentExercisesProps {
  exercises: Exercise[];
  documentId: string;
  patientId?: string;
}

export const DocumentExercises: React.FC<DocumentExercisesProps> = ({
  exercises,
  documentId,
  patientId
}) => {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const handleExerciseComplete = (exerciseIndex: number) => {
    setCompletedExercises(prev => new Set([...prev, `${documentId}-exercise-${exerciseIndex}`]));
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'self_monitoring':
        return TableCellsIcon;
      case 'worksheet':
        return PencilSquareIcon;
      case 'reflection':
        return PencilSquareIcon;
      case 'practice':
        return CheckCircleIcon;
      default:
        return PencilSquareIcon;
    }
  };

  const getExerciseTypeLabel = (type: string) => {
    switch (type) {
      case 'self_monitoring':
        return 'Autoregistro';
      case 'worksheet':
        return 'Hoja de Trabajo';
      case 'reflection':
        return 'Reflexión';
      case 'practice':
        return 'Práctica';
      default:
        return 'Ejercicio';
    }
  };

  if (!exercises.length) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
        Ejercicios Prácticos
      </h3>

      {exercises.map((exercise, index) => {
        const ExerciseIcon = getExerciseIcon(exercise.type);
        const isCompleted = completedExercises.has(`${documentId}-exercise-${index}`);

        return (
          <div
            key={index}
            className={`border rounded-lg p-6 transition-all duration-200 ${
              isCompleted ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
            }`}
          >
            {/* Header del Ejercicio */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`
                  p-2 rounded-lg
                  ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  <ExerciseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{exercise.name}</h4>
                  <span className="text-sm text-gray-500">
                    {getExerciseTypeLabel(exercise.type)}
                  </span>
                </div>
              </div>

              {isCompleted && (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">Completado</span>
                </div>
              )}
            </div>

            {/* Instrucciones */}
            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-gray-700">{exercise.instructions}</p>
            </div>

            {/* Tabla de Seguimiento */}
            {exercise.tracking_table && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Tabla de Seguimiento</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-white">
                        {exercise.tracking_table?.headers.map((header, headerIndex) => (
                          <th
                            key={headerIndex}
                            className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: exercise.tracking_table?.rows_template || 0 }, (_, rowIndex) => (
                        <tr key={rowIndex} className="bg-white">
                          {exercise.tracking_table?.headers.map((_, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border border-gray-300 px-3 py-2 h-10"
                            >
                              {/* Empty cells for user to fill */}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Esta tabla puede ser impresa o descargada para llenar a mano
                </p>
              </div>
            )}

            {/* Botón de Completar */}
            {!isCompleted && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleExerciseComplete(index)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center text-sm"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Marcar como Completado
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};