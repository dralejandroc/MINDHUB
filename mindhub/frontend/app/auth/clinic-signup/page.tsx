'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClinicSignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Clinic Info, 2: Owner Info, 3: Success
  const [clinicData, setClinicData] = useState({
    name: '',
    legal_name: '',
    rfc: '',
    license_number: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    subscription_plan: 'basic'
  });
  const [ownerData, setOwnerData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    license_number: '',
    specialization: ''
  });
  const [error, setError] = useState('');
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleClinicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: ownerData.email,
        password: ownerData.password,
        options: {
          data: {
            first_name: ownerData.first_name,
            last_name: ownerData.last_name,
            role: 'clinic_owner',
            license_number: ownerData.license_number,
            specialization: ownerData.specialization
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create clinic in Django backend
        const clinicResponse = await fetch('/api/clinics/django/clinics/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.session?.access_token}`,
          },
          body: JSON.stringify({
            ...clinicData,
            created_by: authData.user.id
          }),
        });

        if (!clinicResponse.ok) {
          throw new Error('Error al crear la clínica');
        }

        const clinic = await clinicResponse.json();
        
        // 3. Update user profile with clinic_id
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            clinic_id: clinic.id,
            clinic_role: 'clinic_owner'
          }
        });

        if (updateError) throw updateError;

        setStep(3);
      }
    } catch (error) {
      console.error('Clinic signup error:', error);
      setError(error instanceof Error ? error.message : 'Error al crear la clínica');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-800">¡Clínica Creada!</CardTitle>
            <CardDescription>
              Tu clínica ha sido registrada exitosamente. Ya puedes invitar a tu equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Ir al Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/clinic/team')}
              className="w-full"
            >
              Invitar Equipo
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
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-up">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Registro de Clínica
              </CardTitle>
              <CardDescription>
                {step === 1 ? 'Información de la clínica' : 'Datos del administrador'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleClinicSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Clínica *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={clinicData.name}
                    onChange={(e) => setClinicData({...clinicData, name: e.target.value})}
                    required
                    placeholder="Clínica San José"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_name">Razón Social</Label>
                  <Input
                    id="legal_name"
                    type="text"
                    value={clinicData.legal_name}
                    onChange={(e) => setClinicData({...clinicData, legal_name: e.target.value})}
                    placeholder="Clínica San José S.A. de C.V."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    type="text"
                    value={clinicData.rfc}
                    onChange={(e) => setClinicData({...clinicData, rfc: e.target.value})}
                    placeholder="CSJ123456ABC"
                    maxLength={13}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number">Licencia Sanitaria</Label>
                  <Input
                    id="license_number"
                    type="text"
                    value={clinicData.license_number}
                    onChange={(e) => setClinicData({...clinicData, license_number: e.target.value})}
                    placeholder="LS-12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  type="text"
                  value={clinicData.address}
                  onChange={(e) => setClinicData({...clinicData, address: e.target.value})}
                  placeholder="Av. Revolución 123"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    type="text"
                    value={clinicData.city}
                    onChange={(e) => setClinicData({...clinicData, city: e.target.value})}
                    placeholder="Ciudad de México"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    type="text"
                    value={clinicData.state}
                    onChange={(e) => setClinicData({...clinicData, state: e.target.value})}
                    placeholder="CDMX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    type="text"
                    value={clinicData.postal_code}
                    onChange={(e) => setClinicData({...clinicData, postal_code: e.target.value})}
                    placeholder="06100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={clinicData.phone}
                    onChange={(e) => setClinicData({...clinicData, phone: e.target.value})}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email de la Clínica</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clinicData.email}
                    onChange={(e) => setClinicData({...clinicData, email: e.target.value})}
                    placeholder="contacto@clinica.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_plan">Plan de Suscripción</Label>
                <Select value={clinicData.subscription_plan} onValueChange={(value) => 
                  setClinicData({...clinicData, subscription_plan: value})
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

              <Button type="submit" className="w-full" size="lg">
                Continuar
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOwnerSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Datos del Administrador</h3>
                <p className="text-blue-700 text-sm">
                  Como creador de la clínica, tendrás permisos completos para gestionar el equipo y la configuración.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={ownerData.first_name}
                    onChange={(e) => setOwnerData({...ownerData, first_name: e.target.value})}
                    required
                    placeholder="Dr. Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={ownerData.last_name}
                    onChange={(e) => setOwnerData({...ownerData, last_name: e.target.value})}
                    required
                    placeholder="Pérez García"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={ownerData.email}
                  onChange={(e) => setOwnerData({...ownerData, email: e.target.value})}
                  required
                  placeholder="admin@clinica.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={ownerData.password}
                  onChange={(e) => setOwnerData({...ownerData, password: e.target.value})}
                  required
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_license">Cédula Profesional</Label>
                  <Input
                    id="owner_license"
                    type="text"
                    value={ownerData.license_number}
                    onChange={(e) => setOwnerData({...ownerData, license_number: e.target.value})}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Especialización</Label>
                  <Input
                    id="specialization"
                    type="text"
                    value={ownerData.specialization}
                    onChange={(e) => setOwnerData({...ownerData, specialization: e.target.value})}
                    placeholder="Medicina General"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  Atrás
                </Button>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Creando Clínica...' : 'Crear Clínica'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}