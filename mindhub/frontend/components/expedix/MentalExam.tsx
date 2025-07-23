import React from 'react';
import { Card } from '@/components/ui/Card';

interface MentalExamData {
  descripcionInspeccion?: string;
  // Examen Mental
  apariencia?: string;
  actitud?: string;
  conciencia?: string;
  orientacion?: string;
  atencion?: string;
  lenguaje?: string;
  afecto?: string;
  sensopercepcion?: string;
  memoria?: string;
  pensamientoPrincipal?: string;
  pensamientoDetalles?: string;
}

interface MentalExamProps {
  data: MentalExamData;
  onChange: (data: Partial<MentalExamData>) => void;
  title?: string;
  borderColor?: string;
  icon?: string;
  required?: boolean;
}

const MentalExam: React.FC<MentalExamProps> = ({
  data,
  onChange,
  title = "🧬 OBJETIVO - Examen Mental",
  borderColor = "border-l-green-500",
  icon = "🧬",
  required = true
}) => {
  const handleInputChange = (field: keyof MentalExamData, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <Card className={`p-4 border-l-4 ${borderColor}`}>
      <h3 className="text-base font-medium text-gray-900 mb-3">{title}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción de la Inspección {required && '*'}
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            rows={2}
            placeholder="Descripción general del paciente, aspecto físico, vestimenta, comportamiento observado..."
            required={required}
            value={data.descripcionInspeccion || ''}
            onChange={(e) => handleInputChange('descripcionInspeccion', e.target.value)}
          />
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Apariencia {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.apariencia || ''}
              onChange={(e) => handleInputChange('apariencia', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="adecuada">Adecuada</option>
              <option value="desalinada">Desaliñada</option>
              <option value="extrana">Extraña</option>
              <option value="poca_higiene">Poca higiene</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Actitud {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.actitud || ''}
              onChange={(e) => handleInputChange('actitud', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="adecuada">Adecuada</option>
              <option value="negativa">Negativa</option>
              <option value="indiferente">Indiferente</option>
              <option value="irritable">Irritable</option>
              <option value="iracundo">Iracundo</option>
              <option value="deprimida">Deprimida</option>
              <option value="exaltada">Exaltada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Conciencia {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.conciencia || ''}
              onChange={(e) => handleInputChange('conciencia', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="adecuada">Adecuada</option>
              <option value="somnoliento">Somnoliento</option>
              <option value="letargo">Letargo</option>
              <option value="sopor">Sopor</option>
              <option value="obnubilacion">Obnubilación</option>
              <option value="estupor">Estupor</option>
              <option value="alteracion_cualitativa">Alteración cualitativa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Orientación {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.orientacion || ''}
              onChange={(e) => handleInputChange('orientacion', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="bien_orientado_3_esferas">Bien orientado en 3 esferas</option>
              <option value="desorientado_1_esfera">Desorientado en 1 esfera</option>
              <option value="desorientado_2_esferas">Desorientado en 2 esferas</option>
              <option value="desorientado_3_esferas">Desorientado en 3 esferas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Atención {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.atencion || ''}
              onChange={(e) => handleInputChange('atencion', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="adecuada">Adecuada</option>
              <option value="distraida">Distraída</option>
              <option value="desinteresada">Desinteresada</option>
              <option value="aprosexia">Aprosexia</option>
              <option value="hipoprosexia">Hipoprosexia</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lenguaje {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.lenguaje || ''}
              onChange={(e) => handleInputChange('lenguaje', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="adecuado">Adecuado</option>
              <option value="incoherente">Incoherente</option>
              <option value="incongruente">Incongruente</option>
              <option value="afasia">Afasia</option>
              <option value="disartria">Disartria</option>
              <option value="taquilalia">Taquilalia</option>
              <option value="verborrea">Verborrea</option>
              <option value="mutismo">Mutismo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Afecto {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.afecto || ''}
              onChange={(e) => handleInputChange('afecto', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="eutimia">Eutimia</option>
              <option value="tristeza">Tristeza</option>
              <option value="hipotimia">Hipotimia</option>
              <option value="depresivo">Depresivo</option>
              <option value="euforia">Euforia</option>
              <option value="disforia">Disforia</option>
              <option value="hipomania">Hipomanía</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sensopercepción {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.sensopercepcion || ''}
              onChange={(e) => handleInputChange('sensopercepcion', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="sin_alteraciones">Sin alteraciones</option>
              <option value="pseudoalucinaciones">Pseudoalucinaciones</option>
              <option value="ilusiones">Ilusiones</option>
              <option value="alucinaciones">Alucinaciones</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Memoria {required && '*'}</label>
            <select 
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" 
              required={required}
              value={data.memoria || ''}
              onChange={(e) => handleInputChange('memoria', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="adecuada">Adecuada</option>
              <option value="amnesia_retrograda">Amnesia retrógrada</option>
              <option value="amnesia_anterograda">Amnesia anterógrada</option>
              <option value="hipomnesia">Hipomnesia</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pensamiento {required && '*'}</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
            value={data.pensamientoPrincipal || ''}
            onChange={(e) => handleInputChange('pensamientoPrincipal', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="adecuado">Adecuado</option>
            <option value="asociaciones-laxas">Asociaciones laxas</option>
            <option value="ideas-delirantes">Ideas delirantes</option>
            <option value="ideas-obsesivas">Ideas obsesivas</option>
            <option value="fuga-ideas">Fuga de ideas</option>
            <option value="tangencialidad">Tangencialidad</option>
            <option value="circunstancialidad">Circunstancialidad</option>
            <option value="bradipsiquia">Bradipsiquia</option>
            <option value="otro">Otro</option>
          </select>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
            placeholder="Detalles adicionales del pensamiento (opcional)..."
            value={data.pensamientoDetalles || ''}
            onChange={(e) => handleInputChange('pensamientoDetalles', e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
};

export default MentalExam;