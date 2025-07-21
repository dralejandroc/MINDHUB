'use client';

import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserMetrics } from '@/contexts/UserMetricsContext';
import Link from 'next/link';

export function FavoriteScalesWidget() {
  const { preferences } = useUserMetrics();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Escalas Favoritas</h3>
        </div>
        <Link href="/hubs/clinimetrix">
          <Button variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </Link>
      </div>
      
      <div className="space-y-3">
        {preferences.metrics.favoriteScales.length > 0 ? (
          preferences.metrics.favoriteScales.slice(0, 5).map((scale, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">{scale}</span>
              </div>
              <Link href={`/hubs/clinimetrix?scale=${scale}`}>
                <Button size="sm" variant="outline" className="text-xs">
                  Aplicar
                </Button>
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">No tienes escalas favoritas aún</p>
            <Link href="/hubs/clinimetrix">
              <Button size="sm" variant="outline">
                Explorar Escalas
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}