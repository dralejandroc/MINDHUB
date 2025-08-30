/**
 * COMPONENTE UI OPTIMIZADO - Examen Mental
 * Lazy loading y memoización para mejor performance
 */

'use client';

import React, { memo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MentalExam } from '../entities/ConsultationData';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MentalExamSectionProps {
  mentalExam: MentalExam;
  onChange: (mentalExam: MentalExam) => void;
}

const MentalExamSection = memo(function MentalExamSection({ 
  mentalExam, 
  onChange 
}: MentalExamSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof MentalExam, value: string) => {
    onChange({
      ...mentalExam,
      [field]: value
    });
  };

  // Check if any mental exam fields have data
  const hasData = Object.values(mentalExam).some(value => value && value.trim() !== '');
  const completedFieldsCount = Object.values(mentalExam).filter(value => value && value.trim() !== '').length;

  // Lazy loading - solo renderizar cuando esté expandido
  if (!isExpanded) {
    return (
      <Card className={`p-4 mb-6 border-2 ${hasData 
        ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' 
        : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`text-lg font-semibold ${hasData ? 'text-green-900' : 'text-blue-900'}`}>
              🧠 Examen Mental
              {hasData && <span className="ml-2 text-sm font-normal">({completedFieldsCount}/12 campos)</span>}
            </h3>
            <p className={`text-sm mt-1 ${hasData ? 'text-green-700' : 'text-blue-700'}`}>
              {hasData 
                ? 'Evaluación iniciada - Click para continuar editando' 
                : 'Evaluación psiquiátrica completa - Recomendado completar'
              }
            </p>
          </div>
          <Button
            variant="default"
            onClick={() => setIsExpanded(true)}
            className={`flex items-center text-white ${hasData 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            {hasData ? 'Continuar' : 'Completar Examen'}
          </Button>
        </div>
        <div className={`mt-3 text-xs ${hasData ? 'text-green-600' : 'text-blue-600'}`}>
          ✓ Apariencia • ✓ Actitud • ✓ Conciencia • ✓ Orientación • ✓ Atención • ✓ Pensamiento
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Examen Mental</h3>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(false)}
          className="flex items-center"
        >
          <ChevronUp className="w-4 h-4 mr-2" />
          Contraer
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Descripción de la Inspección</label>
          <textarea
            value={mentalExam.descripcionInspeccion}
            onChange={(e) => handleInputChange('descripcionInspeccion', e.target.value)}
            className="w-full p-2 border rounded-md h-20"
            placeholder="Descripción general del paciente..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Apariencia</label>
          <select
            value={mentalExam.apariencia}
            onChange={(e) => handleInputChange('apariencia', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccionar...</option>
            <option value="cuidada">Cuidada</option>
            <option value="descuidada">Descuidada</option>
            <option value="extravagante">Extravagante</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Actitud</label>
          <select
            value={mentalExam.actitud}
            onChange={(e) => handleInputChange('actitud', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccionar...</option>
            <option value="colaboradora">Colaboradora</option>
            <option value="hostil">Hostil</option>
            <option value="evasiva">Evasiva</option>
            <option value="suspicaz">Suspicaz</option>
            <option value="seductora">Seductora</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Conciencia</label>
          <select
            value={mentalExam.conciencia}
            onChange={(e) => handleInputChange('conciencia', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccionar...</option>
            <option value="alerta">Alerta</option>
            <option value="somnolencia">Somnolencia</option>
            <option value="obnubilacion">Obnubilación</option>
            <option value="sopor">Sopor</option>
            <option value="coma">Coma</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Orientación</label>
          <select
            value={mentalExam.orientacion}
            onChange={(e) => handleInputChange('orientacion', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccionar...</option>
            <option value="orientado-tiempo-espacio-persona">Orientado en tiempo, espacio y persona</option>
            <option value="desorientado-tiempo">Desorientado en tiempo</option>
            <option value="desorientado-espacio">Desorientado en espacio</option>
            <option value="desorientado-persona">Desorientado en persona</option>
            <option value="desorientado-total">Desorientación total</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Atención</label>
          <select
            value={mentalExam.atencion}
            onChange={(e) => handleInputChange('atencion', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="hipoprosexia">Hipoprosexia</option>
            <option value="aprosexia">Aprosexia</option>
            <option value="hiperprosexia">Hiperprosexia</option>
            <option value="distractibilidad">Distractibilidad</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lenguaje</label>
          <select
            value={mentalExam.lenguaje}
            onChange={(e) => handleInputChange('lenguaje', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="taquilalia">Taquilalia</option>
            <option value="bradilalia">Bradilalia</option>
            <option value="mutismo">Mutismo</option>
            <option value="ecolalia">Ecolalia</option>
            <option value="neologismos">Neologismos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Afecto</label>
          <select
            value={mentalExam.afecto}
            onChange={(e) => handleInputChange('afecto', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccionar...</option>
            <option value="eutimico">Eutímico</option>
            <option value="depresivo">Depresivo</option>
            <option value="eufórico">Eufórico</option>
            <option value="irritable">Irritable</option>
            <option value="lábil">Lábil</option>
            <option value="aplanado">Aplanado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sensopercepción</label>
          <textarea
            value={mentalExam.sensopercepcion}
            onChange={(e) => handleInputChange('sensopercepcion', e.target.value)}
            className="w-full p-2 border rounded-md h-20"
            placeholder="Alucinaciones, ilusiones, despersonalización..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Memoria</label>
          <select
            value={mentalExam.memoria}
            onChange={(e) => handleInputChange('memoria', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="hipomnesia">Hipomnesia</option>
            <option value="amnesia">Amnesia</option>
            <option value="hipermnesia">Hipermnesia</option>
            <option value="paramnesia">Paramnesia</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Pensamiento - Contenido</label>
          <textarea
            value={mentalExam.pensamientoPrincipal}
            onChange={(e) => handleInputChange('pensamientoPrincipal', e.target.value)}
            className="w-full p-2 border rounded-md h-20"
            placeholder="Ideas delirantes, obsesiones, fobias..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Pensamiento - Detalles del Curso</label>
          <textarea
            value={mentalExam.pensamientoDetalles}
            onChange={(e) => handleInputChange('pensamientoDetalles', e.target.value)}
            className="w-full p-2 border rounded-md h-20"
            placeholder="Velocidad, coherencia, fluidez del pensamiento..."
          />
        </div>
      </div>
    </Card>
  );
});

export default MentalExamSection;