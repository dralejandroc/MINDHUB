'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  UserCircleIcon,
  CogIcon,
  BellIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  KeyIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  HomeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';

export default function UserSettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState({
    name: 'Dr. Ana García López',
    email: 'ana.garcia@clinica.com',
    phone: '+52 55 1234 5678',
    speciality: 'Psicología Clínica',
    license: 'PSI-2019-001234',
    clinic: 'Centro de Salud Mental Integral',
    plan: 'Professional Plus',
    subscription: 'Activa',
    memberSince: '2023'
  });

  const menuItems = [
    { id: 'profile', name: 'Perfil Personal', icon: UserCircleIcon },
    { id: 'clinic', name: 'Información Clínica', icon: CogIcon },
    { id: 'subscription', name: 'Plan y Facturación', icon: CreditCardIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    { id: 'security', name: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'preferences', name: 'Preferencias', icon: KeyIcon }
  ];

  const renderProfileSection = () => (
    <div className="space-y-4">
      <Card className="p-4 bg-primary-50 border-primary-200 hover-lift">
        <h3 className="text-sm font-semibold text-dark-green mb-3">Información Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              value={user.name}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              onChange={(e) => setUser({...user, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={user.email}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              onChange={(e) => setUser({...user, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
            <input 
              type="tel" 
              value={user.phone}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              onChange={(e) => setUser({...user, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Especialidad</label>
            <input 
              type="text" 
              value={user.speciality}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              onChange={(e) => setUser({...user, speciality: e.target.value})}
            />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-primary-200">
          <Button variant="primary" size="sm">Guardar Cambios</Button>
        </div>
      </Card>
    </div>
  );

  const renderSubscriptionSection = () => (
    <div className="space-y-4">
      <Card className="p-4 bg-secondary-50 border-secondary-200 hover-lift">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-dark-green">Plan Actual</h3>
          <span className="px-2 py-1 bg-secondary-100 text-secondary-800 text-xs rounded-full font-medium">
            {user.plan}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-gray-600">Estado:</span>
            <div className="flex items-center mt-1">
              <CheckCircleIcon className="h-3 w-3 text-secondary-600 mr-1" />
              <span className="font-medium text-secondary-600">{user.subscription}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-600">Miembro desde:</span>
            <div className="font-medium text-gray-900 mt-1">{user.memberSince}</div>
          </div>
          <div>
            <span className="text-gray-600">Próximo pago:</span>
            <div className="font-medium text-gray-900 mt-1">15 Ago 2025</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-secondary-200 flex space-x-2">
          <Button variant="outline" size="sm">Cambiar Plan</Button>
          <Button variant="secondary" size="sm">Ver Facturación</Button>
        </div>
      </Card>
    </div>
  );

  const renderActiveContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'subscription':
        return renderSubscriptionSection();
      case 'clinic':
        return (
          <Card className="p-4 bg-purple-50 border-purple-200 hover-lift">
            <h3 className="text-sm font-semibold text-dark-green mb-3">Información Clínica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Clínica/Consultorio</label>
                <input 
                  type="text" 
                  value={user.clinic}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setUser({...user, clinic: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Cédula Profesional</label>
                <input 
                  type="text" 
                  value={user.license}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setUser({...user, license: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <Button variant="purple" size="sm">Actualizar</Button>
            </div>
          </Card>
        );
      default:
        return (
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Sección en desarrollo</h3>
            <p className="text-xs text-gray-600">Esta funcionalidad estará disponible próximamente.</p>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Usuario"
        description="Gestiona tu perfil, plan y preferencias"
        icon={UserCircleIcon}
        iconColor="text-primary-600"
        actions={[
          <Link key="home" href="/">
            <Button variant="outline" size="sm">
              <HomeIcon className="h-3 w-3 mr-1" />
              Ir al Dashboard
            </Button>
          </Link>
        ]}
      />

      {/* User Summary Card */}
      <Card className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 hover-lift">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-3">
              <h2 className="text-base font-bold text-dark-green">{user.name}</h2>
              <p className="text-xs text-gray-600">{user.speciality} • {user.clinic}</p>
              <div className="flex items-center mt-1">
                <span className="px-2 py-0.5 bg-secondary-100 text-secondary-800 text-xs rounded-full font-medium mr-2">
                  {user.plan}
                </span>
                <CheckCircleIcon className="h-3 w-3 text-secondary-600 mr-1" />
                <span className="text-xs text-secondary-600">{user.subscription}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Miembro desde</p>
            <p className="text-sm font-semibold text-gray-900">{user.memberSince}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Navigation Menu */}
        <Card className="p-3 h-fit">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuración</h3>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center text-xs ${
                    activeSection === item.id
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className={`h-4 w-4 mr-2 ${
                    activeSection === item.id ? 'text-primary-600' : 'text-gray-500'
                  }`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderActiveContent()}
        </div>
      </div>
    </div>
  );
}