'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering to avoid SSG issues with searchParams
export const dynamic = 'force-dynamic';

interface VerificationResult {
  success: boolean;
  message: string;
}

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  useEffect(() => {
    // Since we migrated to Auth auth, email verification is handled by Auth
    // This page is now just a redirect to inform users about the new system
    setStatus('success');
    setResult({ 
      success: true, 
      message: 'El sistema de autenticación ha sido actualizado. Ahora usamos Auth para la verificación de email.' 
    });
  }, [token]);

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-teal mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verificando tu email...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras confirmamos tu cuenta.
          </p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Email verificado!
          </h2>
          <p className="text-gray-600 mb-6">
            {result?.message || 'Tu cuenta ha sido verificada exitosamente.'}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">
              Tu cuenta está ahora activa. Puedes iniciar sesión para comenzar a explorar Glian.
            </p>
          </div>
          <Link
            href="/sign-in?verified=true"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-teal to-primary-blue text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Ir al Login
          </Link>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Error de verificación
        </h2>
        <p className="text-gray-600 mb-6">
          {result?.message || 'No pudimos verificar tu email. El enlace puede estar vencido o ser inválido.'}
        </p>
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-teal to-primary-blue text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Volver al inicio
          </Link>
          <p className="text-gray-500 text-xs mt-4">
            ¿Necesitas ayuda? Escríbenos a{' '}
            <a href="mailto:soporte@mindhub.cloud" className="text-primary-teal hover:underline">
              soporte@mindhub.cloud
            </a>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-teal to-primary-blue bg-clip-text text-transparent">
            Glian
          </h1>
          <p className="text-gray-600">Verificación de email</p>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-teal mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cargando...
            </h2>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}