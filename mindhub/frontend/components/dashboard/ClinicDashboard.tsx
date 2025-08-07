'use client';

import { useState, useEffect } from 'react';
import { getOrganizationStats, getMyOrganization, type OrganizationStats, type Organization } from '@/lib/api/organizations-client';
import {
  UsersIcon,
  UserPlusIcon,
  ClockIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ClinicDashboardProps {
  className?: string;
}

export function ClinicDashboard({ className = '' }: ClinicDashboardProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const orgResponse = await getMyOrganization();
      
      if (orgResponse.success && orgResponse.data) {
        setOrganization(orgResponse.data.organization);
        setIsOwner(orgResponse.data.isOwner);
        
        // Load stats if user is owner
        if (orgResponse.data.isOwner && orgResponse.data.organization) {
          const statsResponse = await getOrganizationStats();
          if (statsResponse.success && statsResponse.data) {
            setStats(statsResponse.data.stats);
          }
        }
      }
    } catch (error) {
      setError('Error al cargar datos del dashboard');
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin organización
          </h3>
          <p className="text-gray-600 mb-4">
            No perteneces a ninguna organización. Crea una para comenzar a gestionar tu clínica.
          </p>
          <button
            onClick={() => window.location.href = '/settings'}
            className="bg-primary-teal text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Ir a Configuración
          </button>
        </div>
      </div>
    );
  }

  const getUsagePercentage = () => {
    if (!stats) return 0;
    return Math.round((stats.totalUsers / stats.maxUsers) * 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Organization Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-teal/10 rounded-lg flex items-center justify-center mr-4">
              <BuildingOfficeIcon className="h-6 w-6 text-primary-teal" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{organization.name}</h2>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">{organization.type}</span>
                {organization.isActive && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Activa
                  </span>
                )}
                {isOwner && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Propietario
                  </span>
                )}
              </div>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={() => window.location.href = '/settings'}
              className="text-primary-teal hover:text-teal-600 text-sm font-medium"
            >
              Gestionar
            </button>
          )}
        </div>
      </div>

      {/* Stats for Owners */}
      {isOwner && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profesionales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalUsers}
                  <span className="text-sm text-gray-500 ml-1">/ {stats.maxUsers}</span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Capacidad utilizada</span>
                <span className={`font-medium ${getUsageColor()}`}>
                  {getUsagePercentage()}%
                </span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    getUsagePercentage() >= 90 
                      ? 'bg-red-500' 
                      : getUsagePercentage() >= 70 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${getUsagePercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                {stats.totalUsers - stats.activeUsers} inactivos
              </p>
            </div>
          </div>

          {/* Available Slots */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <UserPlusIcon className="h-5 w-5 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Espacios Libres</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.availableSlots}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Puedes invitar {stats.availableSlots} profesionales más
              </p>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nuevos (7 días)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.recentUsers}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Profesionales recién agregados
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Types Breakdown for Owners */}
      {isOwner && stats && Object.keys(stats.usersByType).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Distribución por Tipo de Cuenta
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.usersByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {type === 'CLINIC' ? 'Propietarios' : 'Profesionales'}
                </span>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-gray-900 mr-2">{count}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-teal h-2 rounded-full"
                      style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity for Owners */}
      {isOwner && stats && stats.lastActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {stats.lastActivity.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-gray-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {user.lastLoginAt && new Date(user.lastLoginAt).toLocaleDateString()}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information for Non-Owners */}
      {!isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Miembro de la Organización
              </h3>
              <p className="text-sm text-blue-700">
                Eres parte de <strong>{organization.name}</strong>. 
                Para gestionar la organización e invitar profesionales, contacta al propietario.
              </p>
              {organization.users && organization.users.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-blue-600 mb-2">Profesionales en la organización:</p>
                  <div className="flex flex-wrap gap-1">
                    {organization.users.slice(0, 5).map((user) => (
                      <span 
                        key={user.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {user.name}
                        {user.accountType === 'CLINIC' && <span className="ml-1">👑</span>}
                      </span>
                    ))}
                    {organization.users.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        +{organization.users.length - 5} más
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}