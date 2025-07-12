'use client';

import { useState } from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import ResourceCatalog from '@/components/resources/ResourceCatalog';
import ResourceUpload from '@/components/resources/ResourceUpload';

type ViewMode = 'catalog' | 'upload';

export default function ResourcesPage() {
  const [currentView, setCurrentView] = useState<ViewMode>('catalog');
  const [resources, setResources] = useState<any[]>([]);

  const handleUploadResource = () => {
    setCurrentView('upload');
  };

  const handleSaveResource = (resourceData: any) => {
    setResources(prev => [...prev, resourceData]);
    setCurrentView('catalog');
    console.log('Resource saved:', resourceData);
  };

  const handleCancelUpload = () => {
    setCurrentView('catalog');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'catalog':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Resources Hub</h1>
                  <p className="text-gray-600">Biblioteca de Materiales Psicoeducativos</p>
                </div>
              </div>
            </div>

            <ResourceCatalog onUploadResource={handleUploadResource} />
          </div>
        );

      case 'upload':
        return (
          <ResourceUpload 
            onCancel={handleCancelUpload}
            onSave={handleSaveResource}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderCurrentView()}
    </div>
  );
}