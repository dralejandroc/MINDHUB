'use client';

import { useState, useEffect } from 'react';
import { 
  CloudIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface QuotaData {
  userId: number;
  planType: string;
  maxStorage: number;
  usedStorage: number;
  availableStorage: number;
  percentageUsed: number;
  isUnlimited: boolean;
  formattedMax: string;
  formattedUsed: string;
  formattedAvailable: string;
}

interface StorageStats {
  quota: QuotaData;
  breakdown: Array<{
    type: string;
    count: number;
    totalSize: number;
    formattedSize: string;
  }>;
  recentUploads: Array<{
    id: number;
    title: string;
    fileSize: number;
    formattedSize: string;
    type: string;
    createdAt: string;
  }>;
  recommendations: Array<{
    type: 'warning' | 'tip' | 'suggestion';
    message: string;
    action: string;
  }>;
}

interface ResourceQuotaIndicatorProps {
  showDetails?: boolean;
  onCleanupRequested?: () => void;
  onUpgradeRequested?: () => void;
}

export default function ResourceQuotaIndicator({ 
  showDetails = false,
  onCleanupRequested,
  onUpgradeRequested
}: ResourceQuotaIndicatorProps) {
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullStats, setShowFullStats] = useState(showDetails);

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resources/storage/quota');
      const data = await response.json();
      
      if (data.success) {
        setQuotaData(data.data);
        
        if (showFullStats || showDetails) {
          await fetchStorageStats();
        }
      } else {
        setError(data.error || 'Error cargando datos de almacenamiento');
      }
    } catch (err) {
      console.error('Error fetching quota:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      const response = await fetch('/api/resources/storage/stats');
      const data = await response.json();
      
      if (data.success) {
        setStorageStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching storage stats:', err);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  const getStatusMessage = (percentage: number, isUnlimited: boolean) => {
    if (isUnlimited) return 'Almacenamiento ilimitado';
    if (percentage >= 95) return 'Almacenamiento casi lleno';
    if (percentage >= 90) return 'Almacenamiento casi agotado';
    if (percentage >= 75) return 'Almacenamiento en advertencia';
    return 'Almacenamiento disponible';
  };

  const handleCleanup = () => {
    if (onCleanupRequested) {
      onCleanupRequested();
    }
  };

  const handleUpgrade = () => {
    if (onUpgradeRequested) {
      onUpgradeRequested();
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600">Cargando información de almacenamiento...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center text-red-600">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  if (!quotaData) return null;

  const statusColor = getStatusColor(quotaData.percentageUsed);
  const statusMessage = getStatusMessage(quotaData.percentageUsed, quotaData.isUnlimited);

  // Compact view
  if (!showFullStats && !showDetails) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CloudIcon className={`h-6 w-6 ${
              statusColor === 'red' ? 'text-red-500' : 
              statusColor === 'yellow' ? 'text-yellow-500' : 'text-green-500'
            }`} />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {quotaData.isUnlimited ? 'Ilimitado' : `${quotaData.formattedUsed} de ${quotaData.formattedMax}`}
              </div>
              <div className="text-xs text-gray-500">{statusMessage}</div>
            </div>
          </div>
          
          {!quotaData.isUnlimited && (
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    statusColor === 'red' ? 'bg-red-500' : 
                    statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(quotaData.percentageUsed, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 w-10">
                {Math.round(quotaData.percentageUsed)}%
              </span>
            </div>
          )}
        </div>

        {quotaData.percentageUsed >= 80 && !quotaData.isUnlimited && (
          <div className="mt-3 flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCleanup}
              className="flex-1"
            >
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={handleUpgrade}
              className="flex-1"
            >
              Ampliar Plan
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // Detailed view
  return (
    <div className="space-y-6">
      {/* Main Quota Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CloudIcon className={`h-8 w-8 ${
              statusColor === 'red' ? 'text-red-500' : 
              statusColor === 'yellow' ? 'text-yellow-500' : 'text-green-500'
            }`} />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Almacenamiento
              </h3>
              <p className="text-sm text-gray-600">
                Plan {quotaData.planType} • {statusMessage}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullStats(!showFullStats)}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            {showFullStats ? 'Ocultar Detalles' : 'Ver Detalles'}
          </Button>
        </div>

        {!quotaData.isUnlimited && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Usado</span>
              <span className="font-medium">{quotaData.formattedUsed} de {quotaData.formattedMax}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  statusColor === 'red' ? 'bg-red-500' : 
                  statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(quotaData.percentageUsed, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{Math.round(quotaData.percentageUsed)}% usado</span>
              <span>{quotaData.formattedMax}</span>
            </div>
          </div>
        )}

        {quotaData.isUnlimited && (
          <div className="text-center py-8">
            <div className="text-2xl font-bold text-green-600 mb-2">
              ∞
            </div>
            <div className="text-gray-600">
              Almacenamiento ilimitado activado
            </div>
          </div>
        )}
      </Card>

      {/* Storage Breakdown */}
      {showFullStats && storageStats && (
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Desglose por Tipo de Archivo
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storageStats.breakdown.map((item) => (
              <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {item.type.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.count} archivo{item.count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {item.formattedSize}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {showFullStats && storageStats?.recommendations && storageStats.recommendations.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Recomendaciones
          </h4>
          
          <div className="space-y-3">
            {storageStats.recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                rec.type === 'warning' ? 'bg-red-50 border-red-400' :
                rec.type === 'tip' ? 'bg-blue-50 border-blue-400' :
                'bg-yellow-50 border-yellow-400'
              }`}>
                <div className="flex items-start">
                  {rec.type === 'warning' ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                  ) : (
                    <InformationCircleIcon className={`h-5 w-5 mt-0.5 mr-3 ${
                      rec.type === 'tip' ? 'text-blue-500' : 'text-yellow-500'
                    }`} />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      rec.type === 'warning' ? 'text-red-800' :
                      rec.type === 'tip' ? 'text-blue-800' :
                      'text-yellow-800'
                    }`}>
                      {rec.message}
                    </p>
                    <p className={`text-sm mt-1 ${
                      rec.type === 'warning' ? 'text-red-600' :
                      rec.type === 'tip' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {rec.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      {!quotaData.isUnlimited && quotaData.percentageUsed >= 70 && (
        <Card className="p-4">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleCleanup}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <CogIcon className="h-4 w-4" />
              <span>Liberar Espacio</span>
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <CloudIcon className="h-4 w-4" />
              <span>Ampliar Plan</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}