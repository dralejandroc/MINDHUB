'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/providers/AuthProvider';
import { updatePassword, updateUserEmail, signOut } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  KeyIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export const UserSecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const { error } = await updatePassword(passwordForm.newPassword);
      
      if (error) {
        throw error;
      }
      
      toast.success('Contraseña actualizada exitosamente');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      
      // Optional: Sign out user to force re-login with new password
      toast.success('Por seguridad, serás redirigido para iniciar sesión nuevamente', { duration: 3000 });
      setTimeout(async () => {
        await signOut();
        window.location.href = '/auth/sign-in';
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Error al actualizar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newEmail === user?.email) {
      toast.error('El nuevo email debe ser diferente al actual');
      return;
    }

    setIsChangingEmail(true);
    
    try {
      const { error } = await updateUserEmail(newEmail);
      
      if (error) {
        throw error;
      }
      
      toast.success('Se ha enviado un email de confirmación a la nueva dirección');
      setShowEmailForm(false);
      
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast.error(error.message || 'Error al actualizar el email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('¿Estás seguro de cerrar sesión en todos los dispositivos? Tendrás que iniciar sesión nuevamente.')) {
      return;
    }

    try {
      await signOut();
      toast.success('Sesión cerrada en todos los dispositivos');
      window.location.href = '/auth/sign-in';
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Configuración de Seguridad</h2>
      </div>

      <div className="space-y-6">
        {/* Current User Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Información de Cuenta</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Email actual:</strong> {user?.email}</p>
            <p><strong>Última actividad:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Creada:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Cambiar Contraseña</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? 'Cancelar' : 'Cambiar'}
            </Button>
          </div>
          
          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1"
                >
                  {isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Change Email Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="h-5 w-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Cambiar Email</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailForm(!showEmailForm)}
            >
              {showEmailForm ? 'Cancelar' : 'Cambiar'}
            </Button>
          </div>
          
          {showEmailForm && (
            <form onSubmit={handleEmailChange} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuevo Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se enviará un email de confirmación a la nueva dirección
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isChangingEmail}
                  className="flex-1"
                >
                  {isChangingEmail ? 'Enviando...' : 'Cambiar Email'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Security Actions */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-900">Acciones de Seguridad</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-red-700">
              Usa estas opciones si sospechas que tu cuenta ha sido comprometida.
            </p>
            <Button
              variant="outline"
              onClick={handleLogoutAllDevices}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Cerrar Sesión en Todos los Dispositivos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};