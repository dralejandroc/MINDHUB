'use client';

import React from 'react';
import { ClockIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface DocumentIntroductionProps {
  introduction: {
    text: string;
    key_points: string[];
  };
  estimatedTime: number;
}

export const DocumentIntroduction: React.FC<DocumentIntroductionProps> = ({
  introduction,
  estimatedTime
}) => {
  return (
    <div className="space-y-6">
      {/* Tiempo estimado */}
      <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
        <ClockIcon className="w-5 h-5 text-blue-600 mr-2" />
        <span className="text-blue-800 font-medium">
          Tiempo estimado de lectura: {estimatedTime} minutos
        </span>
      </div>

      {/* Introducción */}
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed text-lg">
          {introduction.text}
        </p>
      </div>

      {/* Puntos Clave de la Introducción */}
      {introduction.key_points.length > 0 && (
        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-6 rounded-r-lg">
          <div className="flex items-center mb-4">
            <LightBulbIcon className="w-6 h-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-indigo-900">
              Lo que aprenderás
            </h3>
          </div>
          <ul className="space-y-2">
            {introduction.key_points.map((point, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-indigo-800">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};