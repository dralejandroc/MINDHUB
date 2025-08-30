'use client';

import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Award,
  Sparkles
} from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
  icon: any;
  color: string;
  bgColor: string;
}

const stats: Stat[] = [
  {
    label: 'Profesionales Activos',
    value: 2847,
    suffix: '+',
    icon: Users,
    color: 'text-teal-600',
    bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-50',
  },
  {
    label: 'Evaluaciones Realizadas',
    value: 45000,
    suffix: '+',
    icon: Activity,
    color: 'text-cyan-600',
    bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-50',
  },
  {
    label: 'Satisfacción',
    value: 98,
    suffix: '%',
    icon: Award,
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-teal-50',
  },
  {
    label: 'Tiempo Ahorrado',
    value: 40,
    suffix: '%',
    icon: TrendingUp,
    color: 'text-teal-600',
    bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-50',
  },
];

function CountUpAnimation({ 
  initialValue = 0, 
  targetValue, 
  duration = 2,
  prefix = '',
  suffix = '' 
}: {
  initialValue?: number;
  targetValue: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const updateValue = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(initialValue + (targetValue - initialValue) * easeOutQuart);
      
      setValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    updateValue();
  }, [isInView, initialValue, targetValue, duration]);

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

export function AnimatedStatsSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/30 to-white dark:from-gray-900 dark:via-teal-950/20 dark:to-gray-900" />
      
      {/* FlickeringGrid Background */}
      <div className="absolute inset-0 z-0">
        <FlickeringGrid
          squareSize={3}
          gridGap={5}
          flickerChance={0.5}
          color="rgb(37, 99, 235)" // blue-600
          maxOpacity={0.1}
          className="w-full h-full"
        />
      </div>
      
      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-teal-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1 
            }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white mb-6 mx-auto"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gray-900 dark:text-white">
              Números que
            </span>
            <br />
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              hablan por sí solos
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            La confianza de miles de profesionales de la salud respalda nuestra plataforma
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                transition: { type: "spring", stiffness: 300 }
              }}
              className="relative group"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Background decoration */}
                <div className={`absolute inset-0 ${stat.bgColor} opacity-50 group-hover:opacity-70 transition-opacity`} />
                
                {/* Animated border */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${stat.color.replace('text-', 'border-')}, transparent)`,
                    opacity: 0,
                  }}
                  whileHover={{ opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Content */}
                <div className="relative">
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bgColor} ${stat.color} mb-4`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <div className={`text-4xl font-bold ${stat.color}`}>
                      <CountUpAnimation
                        targetValue={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        duration={2.5}
                      />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
                
                {/* Hover effect particles */}
                <motion.div
                  className="absolute top-4 right-4"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sparkles className={`w-4 h-4 ${stat.color}`} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent mx-auto max-w-md"
        />
      </div>
    </section>
  );
}