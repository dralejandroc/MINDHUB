'use client';

import React from 'react';
import { 
  GlobeAltIcon, 
  LockClosedIcon, 
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface LibraryTypeExplainerProps {
  className?: string;
  compact?: boolean;
}

export const LibraryTypeExplainer: React.FC<LibraryTypeExplainerProps> = ({ 
  className = '', 
  compact = false 
}) => {
  if (compact) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p><strong>Biblioteca Pública:</strong> Recursos compartidos por Glian y otros profesionales.</p>
            <p><strong>Mi Biblioteca:</strong> Tus recursos personales, solo visibles para ti.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="bg-blue-500 text-white p-2 rounded-lg mr-3">
          <GlobeAltIcon className="h-5 w-5" />
        </div>
        <h4 className="text-lg font-semibold text-blue-900">Tipos de Biblioteca</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public Library */}
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center mb-3">
            <div className="bg-green-100 text-green-700 p-2 rounded-lg mr-3">
              <GlobeAltIcon className="h-5 w-5" />
            </div>
            <h5 className="font-semibold text-green-900">Biblioteca Pública</h5>
          </div>
          
          <p className="text-gray-700 text-sm mb-3">
            Recursos compartidos y curados por Glian y la comunidad de profesionales de la salud.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              <span>Accesible para todos los usuarios</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              <span>Contenido científicamente validado</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              <span>Incluye marca de agua Glian</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              <span>Actualizaciones automáticas</span>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700 text-center">
            <em>"Hecho y distribuido por Glian. Derechos reservados."</em>
          </div>
        </div>

        {/* Private Library */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-center mb-3">
            <div className="bg-purple-100 text-purple-700 p-2 rounded-lg mr-3">
              <LockClosedIcon className="h-5 w-5" />
            </div>
            <h5 className="font-semibold text-purple-900">Mi Biblioteca Privada</h5>
          </div>
          
          <p className="text-gray-700 text-sm mb-3">
            Tu colección personal de recursos médicos y educativos, completamente bajo tu control.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-purple-500 mr-2" />
              <span>Solo visible para ti</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-purple-500 mr-2" />
              <span>Control total sobre el contenido</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-purple-500 mr-2" />
              <span>Organización personalizada</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-purple-500 mr-2" />
              <span>Marcas de agua opcionales</span>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-purple-50 rounded text-xs text-purple-700 text-center">
            <em>Perfecto para materiales específicos de tu práctica</em>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
        <h6 className="font-medium text-blue-900 mb-2">💡 Consejos de Uso</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <strong>Biblioteca Pública:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Ideal para recursos estándar</li>
              <li>Ahorra tiempo de creación</li>
              <li>Garantía de calidad científica</li>
            </ul>
          </div>
          <div>
            <strong>Mi Biblioteca:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Materiales especializados</li>
              <li>Documentos personalizados</li>
              <li>Recursos específicos del paciente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};