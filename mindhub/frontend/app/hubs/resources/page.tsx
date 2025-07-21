'use client';

import { useState } from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
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
          <>
            <PageHeader
              title="Hub de Recursos"
              description="Biblioteca de Materiales Psicoeducativos"
              icon={BookOpenIcon}
              iconColor="text-orange-600"
            />
            <ResourceCatalog onUploadResource={handleUploadResource} />
          </>
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