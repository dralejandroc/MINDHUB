"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { 
  CalendarIcon, 
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  HeartIcon,
  UserGroupIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

export interface TimelineEntry {
  id: string;
  title: string;
  date: Date | string;
  type: 'consultation' | 'prescription' | 'lab' | 'assessment' | 'note' | 'appointment' | 'vital' | 'diagnosis';
  content: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  metadata?: {
    professional?: string;
    department?: string;
    status?: string;
    priority?: 'high' | 'medium' | 'low';
  };
}

interface TimelineProps {
  data: TimelineEntry[];
  title?: string;
  subtitle?: string;
}

const getIconForType = (type: TimelineEntry['type']) => {
  switch (type) {
    case 'consultation':
      return UserGroupIcon;
    case 'prescription':
      return DocumentTextIcon;
    case 'lab':
      return BeakerIcon;
    case 'assessment':
      return ClipboardDocumentCheckIcon;
    case 'note':
      return DocumentTextIcon;
    case 'appointment':
      return CalendarIcon;
    case 'vital':
      return HeartIcon;
    case 'diagnosis':
      return ChartBarIcon;
    default:
      return DocumentTextIcon;
  }
};

const getColorForType = (type: TimelineEntry['type']) => {
  switch (type) {
    case 'consultation':
      return 'from-blue-500 via-blue-400';
    case 'prescription':
      return 'from-purple-500 via-purple-400';
    case 'lab':
      return 'from-green-500 via-green-400';
    case 'assessment':
      return 'from-indigo-500 via-indigo-400';
    case 'note':
      return 'from-gray-500 via-gray-400';
    case 'appointment':
      return 'from-orange-500 via-orange-400';
    case 'vital':
      return 'from-red-500 via-red-400';
    case 'diagnosis':
      return 'from-cyan-500 via-cyan-400';
    default:
      return 'from-gray-500 via-gray-400';
  }
};

export const Timeline = ({ 
  data, 
  title = "Historial Médico",
  subtitle = "Línea de tiempo completa del expediente del paciente"
}: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Format date for display with error handling
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Fecha no disponible';
    
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'Fecha inválida';
      
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', date);
      return 'Fecha no válida';
    }
  };

  return (
    <div
      className="w-full bg-white dark:bg-neutral-950 font-sans"
      ref={containerRef}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 lg:px-10">
        <h2 className="text-2xl md:text-3xl mb-2 font-bold text-gray-900 dark:text-white max-w-4xl">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-neutral-300 text-sm md:text-base max-w-2xl">
          {subtitle}
        </p>
      </div>

      {/* Timeline Content */}
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => {
          const Icon = item.icon || getIconForType(item.type);
          const gradientColor = item.color || getColorForType(item.type);
          
          return (
            <div
              key={item.id || index}
              className="flex justify-start pt-10 md:pt-20 md:gap-10"
            >
              {/* Left Side - Date and Icon */}
              <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                <div className={`h-12 w-12 absolute left-2 md:left-2 rounded-full bg-gradient-to-br ${gradientColor} to-transparent flex items-center justify-center shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="hidden md:block md:pl-20">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.date)}
                  </p>
                  {item.metadata?.professional && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Dr. {item.metadata.professional}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side - Content */}
              <div className="relative pl-20 pr-4 md:pl-4 w-full">
                <div className="md:hidden mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.date)}
                  </p>
                  {item.metadata?.professional && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Dr. {item.metadata.professional}
                    </p>
                  )}
                </div>
                
                {/* Content Card */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  {item.metadata?.status && (
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mb-3 ${
                      item.metadata.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.metadata.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.metadata.status}
                    </span>
                  )}
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Animated Progress Line */}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};