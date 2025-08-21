'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Save, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

interface ClinicData {
  id: string;
  name: string;
  legal_name: string;
  rfc: string;
  license_number: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  subscription_plan: string;
  is_active: boolean;
}

export default function ClinicSettingsPage() {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchClinicData();
  }, []);

  const fetchClinicData = async () => {
    try {
      const response = await fetch('/api/clinics/django/clinics/');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de la clínica');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setClinic(data.results[0]); // User's clinic
      } else {
        throw new Error('No se encontró información de la clínica');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/clinics/django/clinics/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clinic),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la clínica');
      }

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const updateClinic = (field: keyof ClinicData, value: string) => {
    if (clinic) {
      setClinic({ ...clinic, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            Cargando configuración de la clínica...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-800">Error</CardTitle>
            <CardDescription>
              {error || 'No se pudo cargar la información de la clínica'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
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
                    <Building2 className="w-6 h-6" />
                    Configuración de la Clínica
                  </CardTitle>
                  <CardDescription>
                    Actualiza la información y configuración de tu clínica
                  </CardDescription>
                </div>
              </div>
              <Link href="/clinic/team">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Gestionar Equipo
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Clinic Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Clínica</CardTitle>
            <CardDescription>
              Actualiza los datos básicos y de contacto de tu clínica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Clínica *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={clinic.name}
                    onChange={(e) => updateClinic('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_name">Razón Social</Label>
                  <Input
                    id="legal_name"
                    type="text"
                    value={clinic.legal_name}
                    onChange={(e) => updateClinic('legal_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    type="text"
                    value={clinic.rfc}
                    onChange={(e) => updateClinic('rfc', e.target.value)}
                    maxLength={13}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number">Licencia Sanitaria</Label>
                  <Input
                    id="license_number"
                    type="text"
                    value={clinic.license_number}
                    onChange={(e) => updateClinic('license_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  type="text"
                  value={clinic.address}
                  onChange={(e) => updateClinic('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    type="text"
                    value={clinic.city}
                    onChange={(e) => updateClinic('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    type="text"
                    value={clinic.state}
                    onChange={(e) => updateClinic('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    type="text"
                    value={clinic.postal_code}
                    onChange={(e) => updateClinic('postal_code', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={clinic.phone}
                    onChange={(e) => updateClinic('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email de la Clínica</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clinic.email}
                    onChange={(e) => updateClinic('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={clinic.website}
                    onChange={(e) => updateClinic('website', e.target.value)}
                    placeholder="https://www.clinica.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_plan">Plan de Suscripción</Label>
                  <Select value={clinic.subscription_plan} onValueChange={(value) => 
                    updateClinic('subscription_plan', value)
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico - 5 usuarios, 100 pacientes</SelectItem>
                      <SelectItem value="professional">Profesional - 15 usuarios, 500 pacientes</SelectItem>
                      <SelectItem value="enterprise">Empresarial - 50 usuarios, 2000 pacientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}