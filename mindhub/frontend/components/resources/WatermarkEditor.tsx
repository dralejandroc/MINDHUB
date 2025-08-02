'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export const WatermarkEditor: React.FC = () => {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Plantillas de Marca de Agua
          </h3>
          <Button variant="primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">Editor de marcas de agua próximamente</p>
          <p className="text-sm text-gray-500 mt-2">
            Podrás crear plantillas personalizadas con logos y texto
          </p>
        </div>
      </div>
    </div>
  );
};