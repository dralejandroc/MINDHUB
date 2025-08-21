'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, CheckCircle, AlertTriangle } from 'lucide-react';

interface InvitationData {
  id: string;
  clinic_name: string;
  invited_by_name: string;
  invited_by_email: string;
  clinic_role: string;
  is_expired: boolean;
  is_used: boolean;
}

export default function JoinClinicPage() {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState({
    password: '',
    first_name: '',
    last_name: '',
    license_number: '',
    specialization: ''
  });
  
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/clinics/django/invitations/?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Invitación no encontrada o expirada');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setInvitation(data.results[0]);
      } else {
        throw new Error('Invitación no válida');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar la invitación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAccepting(true);
    setError('');

    try {
      // 1. Create user account in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation!.invited_by_email, // Email from invitation
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: invitation!.clinic_role,
            license_number: userData.license_number,
            specialization: userData.specialization
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Accept invitation through Django
        const acceptResponse = await fetch('/api/clinics/django/invitations/accept/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.session?.access_token}`,
          },
          body: JSON.stringify({
            token: token,
            user_id: authData.user.id
          }),
        });

        if (!acceptResponse.ok) {
          throw new Error('Error al aceptar la invitación');
        }

        setSuccess(true);
      }
    } catch (error) {
      console.error('Invitation acceptance error:', error);
      setError(error instanceof Error ? error.message : 'Error al aceptar la invitación');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            Cargando invitación...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-800">Invitación No Válida</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/auth/sign-up')}
              className="w-full"
            >
              Crear Cuenta Nueva
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-800">¡Bienvenido al Equipo!</CardTitle>
            <CardDescription>
              Te has unido exitosamente a {invitation?.clinic_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Ir al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="text-center">
            <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Únete a {invitation?.clinic_name}</CardTitle>
            <CardDescription className="mt-2">
              {invitation?.invited_by_name} te ha invitado a formar parte del equipo como {invitation?.clinic_role}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {invitation?.is_expired && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded mb-6">
              Esta invitación ha expirado. Contacta a {invitation.invited_by_name} para solicitar una nueva invitación.
            </div>
          )}

          {invitation?.is_used && (
            <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded mb-6">
              Esta invitación ya ha sido utilizada.
            </div>
          )}

          {!invitation?.is_expired && !invitation?.is_used && (
            <form onSubmit={handleAcceptInvitation} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Detalles de la Invitación
                </h3>
                <div className="text-blue-700 text-sm space-y-1">
                  <p><strong>Clínica:</strong> {invitation?.clinic_name}</p>
                  <p><strong>Invitado por:</strong> {invitation?.invited_by_name}</p>
                  <p><strong>Rol:</strong> {invitation?.clinic_role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={userData.first_name}
                    onChange={(e) => setUserData({...userData, first_name: e.target.value})}
                    required
                    placeholder="Dr. Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={userData.last_name}
                    onChange={(e) => setUserData({...userData, last_name: e.target.value})}
                    required
                    placeholder="Pérez García"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={userData.password}
                  onChange={(e) => setUserData({...userData, password: e.target.value})}
                  required
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number">Cédula Profesional</Label>
                  <Input
                    id="license_number"
                    type="text"
                    value={userData.license_number}
                    onChange={(e) => setUserData({...userData, license_number: e.target.value})}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Especialización</Label>
                  <Input
                    id="specialization"
                    type="text"
                    value={userData.specialization}
                    onChange={(e) => setUserData({...userData, specialization: e.target.value})}
                    placeholder="Medicina General"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isAccepting}
              >
                {isAccepting ? 'Uniéndose al Equipo...' : 'Aceptar Invitación y Crear Cuenta'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}