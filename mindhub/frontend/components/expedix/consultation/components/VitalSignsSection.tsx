/**
 * COMPONENTE UI OPTIMIZADO - Signos Vitales
 * Lazy loading y memoización para mejor performance
 */

'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/Card';
import { VitalSigns } from '../entities/ConsultationData';

interface VitalSignsSectionProps {
  vitalSigns: VitalSigns;
  onChange: (vitalSigns: VitalSigns) => void;
}

const VitalSignsSection = memo(function VitalSignsSection({ vitalSigns, onChange }: VitalSignsSectionProps) {
  const handleInputChange = (field: keyof VitalSigns | 'systolic' | 'diastolic', value: string) => {
    if (field === 'systolic' || field === 'diastolic') {
      onChange({
        ...vitalSigns,
        bloodPressure: {
          ...vitalSigns.bloodPressure,
          [field]: value
        }
      });
    } else {
      onChange({
        ...vitalSigns,
        [field]: value
      });
    }
  };

  return (
    <Card className="p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Signos Vitales</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Altura (cm)</label>
          <input
            type="number"
            value={vitalSigns.height}
            onChange={(e) => handleInputChange('height', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="170"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Peso (kg)</label>
          <input
            type="number"
            step="0.1"
            value={vitalSigns.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="70.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Temperatura (°C)</label>
          <input
            type="number"
            step="0.1"
            value={vitalSigns.temperature}
            onChange={(e) => handleInputChange('temperature', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="36.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Frecuencia Cardíaca</label>
          <input
            type="number"
            value={vitalSigns.heartRate}
            onChange={(e) => handleInputChange('heartRate', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="80"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Presión Sistólica</label>
          <input
            type="number"
            value={vitalSigns.bloodPressure.systolic}
            onChange={(e) => handleInputChange('systolic', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Presión Diastólica</label>
          <input
            type="number"
            value={vitalSigns.bloodPressure.diastolic}
            onChange={(e) => handleInputChange('diastolic', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="80"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Frecuencia Respiratoria</label>
          <input
            type="number"
            value={vitalSigns.respiratoryRate}
            onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="16"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Saturación O2 (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={vitalSigns.oxygenSaturation}
            onChange={(e) => handleInputChange('oxygenSaturation', e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="98"
          />
        </div>
      </div>
    </Card>
  );
});

export default VitalSignsSection;