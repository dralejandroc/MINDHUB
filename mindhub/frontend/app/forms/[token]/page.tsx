'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formXHybridService } from '@/lib/formx-hybrid-service';
// import { MobileFormRenderer } from '@/components/formx/MobileFormRenderer';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface FormData {
  id: string;
  title: string;
  description: string;
  sections: any[];
  token?: string;
  patientId?: string;
  expiresAt?: string;
  message?: string;
}

export default function PatientFormPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Detect if mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (token) {
      loadForm();
    }
  }, [token]);

  const loadForm = async () => {
    try {
      setLoading(true);
      console.log('📝 [FormX Page] Loading form via Hybrid Service - Django ONLY (complex business logic)');
      
      const result = await formXHybridService.getFormByToken(token);
      
      if (!result) {
        setError('Error al cargar el formulario. Intente nuevamente.');
        return;
      }

      if (result.status === 'not_found') {
        setError('Formulario no encontrado o token inválido');
        return;
      }
      
      if (result.status === 'expired') {
        setIsExpired(true);
        return;
      }
      
      if (result.status === 'completed') {
        setIsCompleted(true);
        return;
      }
      
      if (result.status === 'active' && result.data) {
        console.log('✅ [FormX Page] Form loaded successfully via hybrid service');
        setFormData(result.data);
      } else {
        throw new Error('Error al cargar el formulario');
      }
    } catch (error) {
      console.error('❌ [FormX Page] Critical error loading form via hybrid service:', error);
      setError('Error al cargar el formulario. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (responses: Record<string, any>) => {
    try {
      console.log('📤 [FormX Page] Submitting form via Hybrid Service - Django ONLY (complex business logic)');
      
      const success = await formXHybridService.submitForm(token, responses);
      if (success) {
        console.log('✅ [FormX Page] Form submitted successfully via hybrid service');
        setIsSubmitted(true);
        toast.success('Formulario enviado exitosamente');
      } else {
        throw new Error('Error al enviar');
      }
    } catch (error) {
      console.error('❌ [FormX Page] Critical error submitting form via hybrid service:', error);
      throw error; // Re-throw to be handled by MobileFormRenderer
    }
  };

  const handleSaveDraft = async (responses: Record<string, any>) => {
    try {
      console.log('💾 [FormX Page] Saving draft via Hybrid Service - Django ONLY (complex business logic)');
      
      const success = await formXHybridService.saveDraft(token, responses);
      if (success) {
        console.log('✅ [FormX Page] Draft saved successfully via hybrid service');
        toast.success('Borrador guardado', { 
          duration: 2000,
          position: 'bottom-center'
        });
      } else {
        throw new Error('Failed to save draft');
      }
    } catch (error) {
      console.error('❌ [FormX Page] Critical error saving draft via hybrid service:', error);
      toast.error('Error al guardar borrador');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={loadForm}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            Intentar nuevamente
          </Button>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <ClockIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Formulario Expirado</h1>
          <p className="text-gray-600 mb-6">
            Este formulario ha expirado y ya no está disponible para completar.
            Contacte a su médico si necesita acceso nuevamente.
          </p>
          <div className="text-sm text-gray-500">
            <p>¿Necesita ayuda?</p>
            <p>Contacte a su clínica o médico tratante</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Formulario Completado</h1>
          <p className="text-gray-600 mb-6">
            Este formulario ya ha sido completado anteriormente.
            Sus respuestas han sido enviadas correctamente.
          </p>
          <div className="text-sm text-gray-500">
            <p>Gracias por completar el formulario</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">¡Formulario Enviado!</h1>
          <p className="text-gray-600 mb-6">
            Sus respuestas han sido enviadas correctamente y han sido registradas en su expediente médico.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-green-800">
              <p className="font-medium">Próximos pasos:</p>
              <ul className="mt-2 space-y-1">
                <li>• Su médico revisará sus respuestas</li>
                <li>• Será contactado si se requiere información adicional</li>
                <li>• Mantenga su cita programada</li>
              </ul>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>Fecha de envío: {new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Formulario no disponible</h1>
          <p className="text-gray-600">
            No se pudo cargar el formulario. Verifique el enlace e intente nuevamente.
          </p>
        </div>
      </div>
    );
  }

  // Desktop fallback view
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Optimizado para móviles</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Este formulário está optimizado para dispositivos móviles. Para la mejor experiencia, ábralo en su teléfono o tablet.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Show basic form for desktop */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{formData.title}</h1>
                <p className="text-gray-600">{formData.description}</p>
                {formData.message && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800">{formData.message}</p>
                  </div>
                )}
              </div>

              {/* Basic desktop form rendering */}
              {formData.sections.map((section, sectionIndex) => (
                <div key={section.id} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="text-gray-600 mb-6">{section.description}</p>
                  )}
                  {/* Fields would be rendered here - simplified for desktop */}
                  <div className="space-y-6">
                    {section.fields.map((field: any) => (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.description && (
                          <p className="text-xs text-gray-500">{field.description}</p>
                        )}
                        {/* Simplified field rendering */}
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                          Campo de tipo: {field.type} - Complete desde móvil para mejor experiencia
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="mt-8 text-center">
                <p className="text-gray-500 mb-4">Para completar este formulario, ábralo en su dispositivo móvil</p>
                <div className="flex justify-center space-x-4">
                  <div className="text-xs text-gray-400">
                    <p>Enlace del formulario:</p>
                    <p className="font-mono bg-gray-100 p-2 rounded break-all">
                      {typeof window !== 'undefined' ? window.location.href : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile optimized view - Temporarily disabled
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <DocumentTextIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">FormX Mobile</h1>
        <p className="text-gray-600 mb-6">
          El sistema de formularios móviles será habilitado próximamente.
        </p>
        <p className="text-sm text-gray-500">
          Formulario: {formData.title}
        </p>
      </div>
    </div>
  );
}