'use client';

import { UserGroupIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserMetrics } from '@/contexts/UserMetricsContext';
import Link from 'next/link';

export function FollowupPatientsWidget() {
  const { preferences, removeCloseFollowupPatient } = useUserMetrics();

  const handleRemovePatient = (patientId: string) => {
    removeCloseFollowupPatient(patientId);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Seguimiento Estrecho</h3>
        </div>
        <Link href="/hubs/expedix">
          <Button variant="outline" size="sm">Ver Todos</Button>
        </Link>
      </div>
      
      <div className="space-y-3">
        {preferences.metrics.closeFollowupPatients.length > 0 ? (
          preferences.metrics.closeFollowupPatients.slice(0, 5).map((patientId, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">
                    {patientId.slice(-2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Paciente {patientId.slice(-4)}</p>
                  <p className="text-xs text-gray-500">ID: {patientId.slice(-8)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Link href={`/hubs/expedix?patient=${patientId}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs text-red-600 hover:bg-red-50"
                  onClick={() => handleRemovePatient(patientId)}
                >
                  <XMarkIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">No hay pacientes en seguimiento estrecho</p>
            <Link href="/hubs/expedix">
              <Button size="sm" variant="outline">
                Gestionar Pacientes
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Agrega pacientes desde Expedix para seguimiento prioritario
        </p>
      </div>
    </Card>
  );
}