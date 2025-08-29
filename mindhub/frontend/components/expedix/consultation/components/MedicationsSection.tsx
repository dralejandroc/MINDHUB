/**
 * COMPONENTE UI OPTIMIZADO - Medicamentos
 * Búsqueda optimizada con debounce y virtualization
 */

'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Medication } from '../entities/ConsultationData';
import { Search, Plus, X } from 'lucide-react';

interface MedicationsSectionProps {
  medications: Medication[];
  onSearch: (query: string) => Promise<any[]>;
  onChange: (medications: Medication[]) => void;
}

const MedicationsSection = memo(function MedicationsSection({ 
  medications, 
  onSearch, 
  onChange 
}: MedicationsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await onSearch(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [onSearch]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const handleAddMedication = useCallback((medication: any) => {
    const newMedication: Medication = {
      id: medication.id,
      name: medication.name,
      presentation: medication.presentation,
      substance: medication.substance,
      prescription: '' // Se llena por el médico
    };

    const exists = medications.find(m => m.id === medication.id);
    if (!exists) {
      onChange([...medications, newMedication]);
    }
    
    setSearchQuery('');
    setSearchResults([]);
  }, [medications, onChange]);

  const handleRemoveMedication = useCallback((medicationId: number) => {
    onChange(medications.filter(m => m.id !== medicationId));
  }, [medications, onChange]);

  const handlePrescriptionChange = useCallback((medicationId: number, prescription: string) => {
    onChange(medications.map(m => 
      m.id === medicationId ? { ...m, prescription } : m
    ));
  }, [medications, onChange]);

  return (
    <Card className="p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Medicamentos</h3>
      
      {/* Búsqueda de medicamentos */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar medicamento..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
        
        {/* Resultados de búsqueda */}
        {isSearching && (
          <div className="mt-2 p-3 border rounded-md bg-gray-50">
            Buscando...
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                onClick={() => handleAddMedication(result)}
              >
                <div>
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-gray-600">{result.presentation}</div>
                  <div className="text-xs text-gray-500">{result.substance}</div>
                </div>
                <Plus className="w-4 h-4 text-green-600" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medicamentos agregados */}
      <div className="space-y-3">
        {medications.map((medication) => (
          <div key={medication.id} className="border rounded-md p-3 bg-blue-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium">{medication.name}</div>
                <div className="text-sm text-gray-600">{medication.presentation}</div>
                <div className="text-xs text-gray-500">{medication.substance}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMedication(medication.id)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Prescripción</label>
              <textarea
                value={medication.prescription}
                onChange={(e) => handlePrescriptionChange(medication.id, e.target.value)}
                placeholder="Ej: 1 tableta cada 8 horas por 7 días"
                className="w-full p-2 border rounded-md text-sm"
                rows={2}
              />
            </div>
          </div>
        ))}
        
        {medications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay medicamentos agregados. Busque y seleccione medicamentos arriba.
          </div>
        )}
      </div>
    </Card>
  );
});

// Utility function - debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}

export default MedicationsSection;