'use client';

import { PricingSection } from '@/components/ui/pricing-section';
import type { PricingTier } from '@/components/ui/pricing-card';

interface PlansSectionProps {
  onBetaClick: () => void;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Profesional Individual',
    description: 'Perfecto para psicólogos y psiquiatras independientes',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Gestión de pacientes ilimitada',
      'Sistema de expedientes digitales',
      'ClinimetrixPro: 29+ escalas psicométricas',
      'Agenda de citas inteligente',
      'Recetas digitales',
      'Portal para pacientes',
      'Reportes y estadísticas',
      'Soporte por email',
      'Acceso móvil completo',
    ],
    popular: true,
    buttonText: '🚀 Acceso Beta Gratuito',
  },
  {
    name: 'Clínica y Equipos',
    description: 'Diseñado para clínicas y equipos de salud mental',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Todo lo del plan Individual',
      'Gestión multi-usuario',
      'Roles y permisos avanzados',
      'Dashboard administrativo',
      'Facturación integrada',
      'Recursos psicoeducativos',
      'Plantillas personalizadas',
      'Soporte prioritario',
      'Capacitación del equipo',
    ],
    buttonText: '🏥 Acceso Beta Gratuito',
  },
];

export function PlansSection({ onBetaClick }: PlansSectionProps) {
  return (
    <section id="plans" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PricingSection
          title="Planes y Precios"
          subtitle="Durante la Beta, ambos planes están completamente gratis. Tu feedback nos ayudará a crear la mejor plataforma para profesionales de salud mental."
          tiers={pricingTiers}
          frequencies={['Mensual', 'Anual']}
        />

        {/* Beta Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-full">
            <span className="text-2xl mr-2">🎉</span>
            <span className="text-green-800 font-medium">
              Beta Gratuito hasta Q2 2025 - ¡Regístrate ahora!
            </span>
          </div>
        </div>

        {/* Contact Notice */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            ¿Tienes preguntas sobre nuestros futuros planes?
          </p>
          <a 
            href="mailto:planes@mindhub.cloud"
            className="text-primary-teal hover:text-primary-blue font-medium transition-colors"
          >
            Escríbenos y te mantendremos al tanto
          </a>
        </div>
      </div>
    </section>
  );
}