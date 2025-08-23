'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, differenceInMonths, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserIcon,
  ClockIcon,
  CalendarIcon,
  PhoneIcon,
  CakeIcon,
  HeartIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface PatientTooltipData {
  // Basic Patient Info (GDPR/HIPAA compliant)
  patientId: string;
  name: string;
  dateOfBirth?: string;
  age?: number;
  
  // Appointment Info
  appointmentTime: string;
  duration: number;
  consultationType: 'presencial' | 'virtual' | 'telefonica';
  location?: string;
  
  // Clinical History (sensitive data)
  followUpTimeMonths?: number;
  lastVisitDate?: string;
  nextAppointmentDate?: string;
  totalVisits?: number;
  
  // Contact Info (encrypted)
  phone?: string;
  email?: string;
  
  // Payment Info
  paymentStatus?: 'paid' | 'pending' | 'deposit' | 'debt';
  depositAmount?: number;
  
  // Security Context (for dual system)
  licenseType?: 'clinic' | 'individual';
  canViewContactInfo?: boolean;
  canViewClinicalHistory?: boolean;
  encryptionStatus?: 'encrypted' | 'partial' | 'error';
}

interface PatientTooltipProps {
  patientData: PatientTooltipData;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
  maxWidth?: number;
  showSecurityIndicators?: boolean;
}

export const PatientTooltip: React.FC<PatientTooltipProps> = ({
  patientData,
  children,
  position = 'auto',
  delay = 500,
  maxWidth = 300,
  showSecurityIndicators = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Calculate age if dateOfBirth is available
  const calculateAge = (dateOfBirth: string): number => {
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  // Calculate follow-up time in human-readable format
  const formatFollowUpTime = (months: number): string => {
    if (months < 12) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }
    return `${years}a ${remainingMonths}m`;
  };

  // Determine optimal position
  const calculatePosition = () => {
    if (position !== 'auto') return position;
    
    if (!triggerRef.current) return 'top';
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Prefer top if there's space
    if (rect.top > 200) return 'top';
    if (viewportHeight - rect.bottom > 200) return 'bottom';
    if (rect.left > maxWidth + 20) return 'left';
    if (viewportWidth - rect.right > maxWidth + 20) return 'right';
    
    return 'bottom'; // fallback
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActualPosition(calculatePosition());
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = `
      absolute z-[200] bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 
      transition-all duration-200 pointer-events-none backdrop-blur-sm
      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `;

    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-3',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-3',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-3',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-3'
    };

    return `${baseClasses} ${positionClasses[actualPosition]}`;
  };

  const getArrowClasses = () => {
    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white border-8',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white border-8',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white border-8',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white border-8'
    };

    return `absolute w-0 h-0 ${arrowClasses[actualPosition]} drop-shadow-sm`;
  };

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case 'virtual':
        return <VideoCameraIcon className="w-4 h-4 text-blue-500" />;
      case 'telefonica':
        return <PhoneIcon className="w-4 h-4 text-green-500" />;
      case 'presencial':
      default:
        return <MapPinIcon className="w-4 h-4 text-primary-500" />;
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'deposit':
        return 'text-blue-600 bg-blue-50';
      case 'debt':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const age = patientData.dateOfBirth ? calculateAge(patientData.dateOfBirth) : patientData.age;

  return (
    <div 
      ref={triggerRef}
      className="relative w-full h-full"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={getTooltipClasses()}
          style={{ maxWidth: `${maxWidth}px` }}
          role="tooltip"
          aria-label={`Información del paciente ${patientData.name}`}
        >
          <div className="p-4 space-y-3">
            {/* Security Header */}
            {showSecurityIndicators && (
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">
                    {patientData.licenseType === 'clinic' ? 'Clínica' : 'Individual'}
                  </span>
                </div>
                {patientData.encryptionStatus === 'encrypted' && (
                  <div className="w-2 h-2 bg-green-400 rounded-full" title="Datos encriptados" />
                )}
              </div>
            )}

            {/* Patient Name & Basic Info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {patientData.name}
                </h3>
                <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>
              
              {/* Age and Birth Date */}
              {(age || patientData.dateOfBirth) && (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <CakeIcon className="w-3 h-3" />
                  <span>
                    {age && `${age} años`}
                    {patientData.dateOfBirth && age && ' • '}
                    {patientData.dateOfBirth && format(new Date(patientData.dateOfBirth), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Appointment Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <ClockIcon className="w-4 h-4" />
                <span>{patientData.appointmentTime}</span>
                <span className="text-gray-500">• {patientData.duration} min</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                {getConsultationIcon(patientData.consultationType)}
                <span className="capitalize">{patientData.consultationType}</span>
                {patientData.location && (
                  <span className="text-gray-500">• {patientData.location}</span>
                )}
              </div>
            </div>

            {/* Clinical History */}
            {patientData.canViewClinicalHistory && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <HeartIcon className="w-3 h-3" />
                  <span>
                    {patientData.followUpTimeMonths && (
                      `Seguimiento: ${formatFollowUpTime(patientData.followUpTimeMonths)}`
                    )}
                    {patientData.totalVisits && (
                      ` • ${patientData.totalVisits} consultas`
                    )}
                  </span>
                </div>

                {patientData.lastVisitDate && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <CalendarIcon className="w-3 h-3" />
                    <span>
                      Última visita: {format(new Date(patientData.lastVisitDate), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Contact Info (if authorized) */}
            {patientData.canViewContactInfo && patientData.phone && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <PhoneIcon className="w-3 h-3" />
                  <span>{patientData.phone}</span>
                </div>
              </div>
            )}

            {/* Payment Status */}
            {patientData.paymentStatus && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-3 h-3 text-gray-500" />
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${getPaymentStatusColor(patientData.paymentStatus)}
                    `}>
                      {patientData.paymentStatus === 'paid' && 'Pagado'}
                      {patientData.paymentStatus === 'pending' && 'Pendiente'}
                      {patientData.paymentStatus === 'deposit' && 'Depósito'}
                      {patientData.paymentStatus === 'debt' && 'Deuda'}
                    </span>
                  </div>
                  
                  {patientData.depositAmount && (
                    <span className="text-xs text-gray-600">
                      ${patientData.depositAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Data Privacy Notice */}
            {showSecurityIndicators && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <DocumentTextIcon className="w-3 h-3" />
                  <span>Datos protegidos GDPR/HIPAA</span>
                </div>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
};