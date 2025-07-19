'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUniversalScales } from '@/contexts/UniversalScalesContext';
import UniversalCardBasedAssessment from '@/components/clinimetrix/UniversalCardBasedAssessment';

export default function FullscreenAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { startAssessment, state } = useUniversalScales();
  const hasStartedRef = useRef(false);
  
  const scaleId = params?.scaleId as string;

  useEffect(() => {
    if (scaleId && !hasStartedRef.current && !state.isAssessmentActive) {
      hasStartedRef.current = true;
      
      // Iniciar la evaluación automáticamente
      const demoPatientId = 'demo-patient-001';
      const demoClinician = 'demo-clinician-001';
      
      startAssessment(scaleId, demoPatientId, demoClinician).catch(error => {
        console.error('Error starting assessment:', error);
        hasStartedRef.current = false; // Reset en caso de error
        router.push('/hubs/clinimetrix');
      });
    }
  }, [scaleId, state.isAssessmentActive, startAssessment, router]);

  const handleBack = () => {
    router.push('/hubs/clinimetrix');
  };

  const handleComplete = (results: any) => {
    console.log('Assessment completed:', results);
    // Aquí podrías guardar los resultados antes de regresar
    setTimeout(() => {
      router.push('/hubs/clinimetrix');
    }, 3000); // Dar tiempo para ver los resultados
  };

  // Mostrar loading mientras se inicializa
  if (!state.isAssessmentActive) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #FFF8EE, #29A98C)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            animation: 'spin 1s linear infinite',
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #29A98C',
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#112F33', fontSize: '1.1rem' }}>
            Iniciando evaluación...
          </p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <UniversalCardBasedAssessment
      onBack={handleBack}
      onComplete={handleComplete}
      fullscreen={true}
    />
  );
}