'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Mail, Building2, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  clinic_role: string;
  specialization?: string;
  license_number?: string;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  clinic_role: string;
  invited_by_name: string;
  created_at: string;
  is_expired: boolean;
  is_used: boolean;
}

export default function ClinicTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    clinic_role: 'professional'
  });
  const [isInviting, setIsInviting] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      // Fetch team members
      const membersResponse = await fetch('/api/clinics/django/profiles/');
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setTeamMembers(membersData.results || []);
      }

      // Fetch pending invitations
      const invitationsResponse = await fetch('/api/clinics/django/invitations/');
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.results || []);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Error al cargar la información del equipo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError('');

    try {
      const response = await fetch('/api/clinics/django/invitations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la invitación');
      }

      // Refresh data and close dialog
      await fetchTeamData();
      setIsInviteDialogOpen(false);
      setInviteData({ email: '', clinic_role: 'professional' });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al enviar la invitación');
    } finally {
      setIsInviting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'clinic_owner': return 'bg-purple-100 text-purple-800';
      case 'administrator': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-green-100 text-green-800';
      case 'assistant': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'clinic_owner': return 'Propietario';
      case 'administrator': return 'Administrador';
      case 'professional': return 'Profesional';
      case 'assistant': return 'Asistente';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            Cargando equipo de la clínica...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Equipo de la Clínica
                  </CardTitle>
                  <CardDescription>
                    Gestiona los miembros de tu equipo y envía invitaciones
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/clinic/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </Button>
                </Link>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invitar Miembro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                      <DialogDescription>
                        Envía una invitación para que se una al equipo de la clínica
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendInvite} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite_email">Email del Miembro</Label>
                        <Input
                          id="invite_email"
                          type="email"
                          value={inviteData.email}
                          onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                          required
                          placeholder="nuevo.miembro@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite_role">Rol en la Clínica</Label>
                        <Select value={inviteData.clinic_role} onValueChange={(value) => 
                          setInviteData({...inviteData, clinic_role: value})
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administrator">Administrador</SelectItem>
                            <SelectItem value="professional">Profesional</SelectItem>
                            <SelectItem value="assistant">Asistente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full" disabled={isInviting}>
                        {isInviting ? 'Enviando Invitación...' : 'Enviar Invitación'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Miembros del Equipo ({teamMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">
                        {member.first_name[0]}{member.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                      {member.specialization && (
                        <div className="text-sm text-gray-500">{member.specialization}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(member.clinic_role)}>
                      {getRoleLabel(member.clinic_role)}
                    </Badge>
                    {!member.is_active && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay miembros en el equipo todavía
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Invitaciones Pendientes ({invitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">{invitation.email}</div>
                      <div className="text-sm text-gray-600">
                        Invitado por {invitation.invited_by_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(invitation.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(invitation.clinic_role)}>
                        {getRoleLabel(invitation.clinic_role)}
                      </Badge>
                      {invitation.is_expired ? (
                        <Badge variant="destructive">Expirada</Badge>
                      ) : invitation.is_used ? (
                        <Badge variant="secondary">Usada</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}