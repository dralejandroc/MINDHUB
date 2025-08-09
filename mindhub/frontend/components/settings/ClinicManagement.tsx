'use client';

import { useState, useEffect } from 'react';
import { 
  getMyOrganization, 
  createOrganization, 
  updateOrganization, 
  inviteUser, 
  removeUser,
  getOrganizationStats,
  type Organization,
  type OrganizationUser,
  type OrganizationStats 
} from '@/lib/api/organizations-client-stub';

export function ClinicManagement() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create organization states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<'CLINIC' | 'HOSPITAL' | 'CONSULTORIO'>('CLINIC');
  
  // Invite user states
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Edit organization states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getMyOrganization();
      
      if (response.success && response.data) {
        setOrganization(response.data.organization);
        setIsOwner(response.data.isOwner);
        setEditName(response.data.organization?.name || '');
        
        // Load stats if user is owner
        if (response.data.isOwner && response.data.organization) {
          const statsResponse = await getOrganizationStats();
          if (statsResponse.success && statsResponse.data) {
            setStats(statsResponse.data.stats);
          }
        }
      }
    } catch (error) {
      setError('Error al cargar información de la organización');
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await createOrganization({
        name: organizationName.trim(),
        type: organizationType
      });
      
      if (response.success) {
        setSuccess('Organización creada exitosamente');
        setShowCreateForm(false);
        setOrganizationName('');
        await loadOrganizationData();
      } else {
        setError(response.message || 'Error al crear organización');
      }
    } catch (error) {
      setError('Error al crear organización');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await updateOrganization({
        name: editName.trim()
      });
      
      if (response.success) {
        setSuccess('Organización actualizada exitosamente');
        setShowEditForm(false);
        await loadOrganizationData();
      } else {
        setError(response.message || 'Error al actualizar organización');
      }
    } catch (error) {
      setError('Error al actualizar organización');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setInviteLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await inviteUser({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined
      });
      
      if (response.success) {
        if (response.data?.userAdded) {
          setSuccess(`Usuario ${inviteEmail} agregado exitosamente a la organización`);
        } else {
          setSuccess(`Invitación enviada a ${inviteEmail}`);
        }
        setShowInviteForm(false);
        setInviteEmail('');
        setInviteName('');
        await loadOrganizationData();
      } else {
        setError(response.message || 'Error al enviar invitación');
      }
    } catch (error) {
      setError('Error al enviar invitación');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de remover a ${userEmail} de la organización?`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await removeUser(userId);
      
      if (response.success) {
        setSuccess(`Usuario ${userEmail} removido exitosamente`);
        await loadOrganizationData();
      } else {
        setError(response.message || 'Error al remover usuario');
      }
    } catch (error) {
      setError('Error al remover usuario');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-teal"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Gestión de Clínica</h2>
        <p className="text-sm text-gray-600 mt-1">
          Administra tu organización y profesionales
        </p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* No Organization - Create Form */}
      {!organization && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Organización</h3>
          <p className="text-gray-600 mb-4">
            Para gestionar una clínica y agregar profesionales, primero debes crear una organización.
          </p>
          
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-teal text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Crear Organización
            </button>
          ) : (
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Organización
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                  placeholder="Ej: Clínica San José"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Organización
                </label>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                >
                  <option value="CLINIC">Clínica</option>
                  <option value="HOSPITAL">Hospital</option>
                  <option value="CONSULTORIO">Consultorio</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-teal text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setOrganizationName('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Organization Info */}
      {organization && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Información de la Organización</h3>
            {isOwner && (
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                className="text-primary-teal hover:text-teal-600 text-sm font-medium"
              >
                {showEditForm ? 'Cancelar' : 'Editar'}
              </button>
            )}
          </div>
          
          {!showEditForm ? (
            <div className="space-y-2">
              <p><strong>Nombre:</strong> {organization.name}</p>
              <p><strong>Tipo:</strong> {organization.type}</p>
              <p><strong>Usuarios máximos:</strong> {organization.maxUsers}</p>
              <p><strong>Estado:</strong> {organization.isActive ? 'Activa' : 'Inactiva'}</p>
            </div>
          ) : (
            <form onSubmit={handleUpdateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Organización
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-teal text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditName(organization.name);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Organization Stats */}
      {stats && isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-teal">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Usuarios totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Usuarios activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.availableSlots}</div>
              <div className="text-sm text-gray-600">Espacios disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.recentUsers}</div>
              <div className="text-sm text-gray-600">Nuevos (7 días)</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Management */}
      {organization && isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Profesionales</h3>
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="bg-primary-teal text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors text-sm"
            >
              {showInviteForm ? 'Cancelar' : 'Invitar Profesional'}
            </button>
          </div>
          
          {/* Invite Form */}
          {showInviteForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email del profesional
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="profesional@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre (opcional)
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="Dr. Juan Pérez"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="bg-primary-teal text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                  >
                    {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Users List */}
          {organization.users && organization.users.length > 0 ? (
            <div className="space-y-2">
              {organization.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {user.accountType === 'CLINIC' ? 'Propietario' : 'Profesional'} • 
                      {user.isActive ? ' Activo' : ' Inactivo'}
                      {user.lastLoginAt && (
                        <> • Último acceso: {new Date(user.lastLoginAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  
                  {user.accountType !== 'CLINIC' && (
                    <button
                      onClick={() => handleRemoveUser(user.id, user.email)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
                      disabled={loading}
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No hay profesionales en la organización
            </p>
          )}
        </div>
      )}

      {/* Information for non-owners */}
      {organization && !isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Eres miembro de <strong>{organization.name}</strong>. 
            Solo el propietario puede gestionar la organización e invitar nuevos profesionales.
          </p>
        </div>
      )}
    </div>
  );
}