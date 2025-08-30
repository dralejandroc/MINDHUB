'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import {
  Brain,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Shield,
  Stethoscope,
  Clock,
  Heart,
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { 
  BentoGrid, 
  BentoCard, 
  GridPattern, 
  DotPattern, 
  WavePattern, 
  PulseCircle 
} from '@/components/ui/bento-grid';

const features = [
  {
    name: "Expedientes Médicos Digitales",
    description: "Gestión completa de historiales clínicos con encriptación y acceso seguro desde cualquier dispositivo.",
    href: "/features/expedix",
    cta: "Explorar Expedix",
    Icon: FileText,
    className: "lg:col-span-2",
    background: (
      <div className="absolute inset-0">
        <GridPattern className="opacity-30" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-cyan-500/20"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>
    ),
  },
  {
    name: "Evaluaciones Psicométricas",
    description: "29 escalas especializadas con scoring automático e interpretación clínica instantánea.",
    href: "/features/clinimetrix",
    cta: "Ver Escalas",
    Icon: Brain,
    className: "lg:col-span-1",
    background: (
      <div className="absolute inset-0">
        <PulseCircle className="opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10" />
      </div>
    ),
  },
  {
    name: "Agenda Inteligente",
    description: "Sistema de citas con recordatorios automáticos, lista de espera y sincronización multi-dispositivo.",
    href: "/features/agenda",
    cta: "Gestionar Citas",
    Icon: Calendar,
    className: "lg:col-span-1",
    background: (
      <div className="absolute inset-0">
        <DotPattern className="opacity-30" />
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, rgba(20, 184, 166, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(20, 184, 166, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, rgba(20, 184, 166, 0.15) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    ),
  },
  {
    name: "Portal de Pacientes",
    description: "Acceso seguro para pacientes a sus resultados, citas y comunicación directa con profesionales.",
    href: "/features/portal",
    cta: "Conocer Portal",
    Icon: Users,
    className: "lg:col-span-2",
    background: (
      <div className="absolute inset-0">
        <WavePattern className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-teal-500/10" />
      </div>
    ),
  },
  {
    name: "Análisis y Reportes",
    description: "Dashboard con métricas en tiempo real y reportes personalizables para toma de decisiones.",
    href: "/features/analytics",
    cta: "Ver Analytics",
    Icon: BarChart3,
    className: "lg:col-span-1",
    background: (
      <div className="absolute inset-0">
        <svg className="absolute inset-0 w-full h-full">
          <motion.rect
            x="10%"
            y="60%"
            width="15%"
            height="30%"
            fill="rgba(20, 184, 166, 0.1)"
            animate={{ height: ["30%", "50%", "30%"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.rect
            x="30%"
            y="40%"
            width="15%"
            height="50%"
            fill="rgba(6, 182, 212, 0.1)"
            animate={{ height: ["50%", "70%", "50%"] }}
            transition={{ duration: 2, delay: 0.2, repeat: Infinity }}
          />
          <motion.rect
            x="50%"
            y="50%"
            width="15%"
            height="40%"
            fill="rgba(59, 130, 246, 0.1)"
            animate={{ height: ["40%", "60%", "40%"] }}
            transition={{ duration: 2, delay: 0.4, repeat: Infinity }}
          />
          <motion.rect
            x="70%"
            y="45%"
            width="15%"
            height="45%"
            fill="rgba(37, 99, 235, 0.1)"
            animate={{ height: ["45%", "65%", "45%"] }}
            transition={{ duration: 2, delay: 0.6, repeat: Infinity }}
          />
        </svg>
      </div>
    ),
  },
  {
    name: "Seguridad HIPAA",
    description: "Cumplimiento total con estándares internacionales de privacidad y protección de datos médicos.",
    href: "/features/security",
    cta: "Ver Seguridad",
    Icon: Shield,
    className: "lg:col-span-1",
    background: (
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "linear-gradient(45deg, rgba(20, 184, 166, 0.05) 0%, transparent 100%)",
              "linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, transparent 100%)",
              "linear-gradient(225deg, rgba(20, 184, 166, 0.05) 0%, transparent 100%)",
              "linear-gradient(315deg, rgba(20, 184, 166, 0.05) 0%, transparent 100%)",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <GridPattern className="opacity-10" />
      </div>
    ),
  },
  {
    name: "Telemedicina Integrada",
    description: "Consultas virtuales con videollamada HD, compartir pantalla y prescripción digital.",
    href: "/features/telemedicine",
    cta: "Iniciar Consulta",
    Icon: Stethoscope,
    className: "lg:col-span-2",
    background: (
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/10" />
        <motion.div
          className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
        </motion.div>
      </div>
    ),
  },
];

export function BentoFeaturesSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* FlickeringGrid Background */}
      <div className="absolute inset-0 z-0">
        <FlickeringGrid
          squareSize={4}
          gridGap={8}
          flickerChance={0.4}
          color="rgb(6, 182, 212)" // cyan-500
          maxOpacity={0.15}
          className="w-full h-full"
        />
      </div>
      
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-teal-400/30 to-cyan-400/30 rounded-full filter blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full filter blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-700 dark:text-teal-300 text-sm font-medium mb-4"
          >
            <Zap className="w-4 h-4" />
            Funcionalidades Premium
          </motion.span>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Todo lo que necesitas
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              en una sola plataforma
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Descubre cómo MindHub revoluciona la gestión sanitaria con herramientas 
            inteligentes diseñadas para optimizar cada aspecto de tu práctica médica.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <BentoGrid className="mx-auto">
          {features.map((feature, idx) => (
            <BentoCard
              key={feature.name}
              {...feature}
              delay={idx * 0.1}
            />
          ))}
        </BentoGrid>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            ¿Quieres ver todas las funcionalidades en acción?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Activity className="w-5 h-5" />
            Solicitar Demo Personalizada
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}