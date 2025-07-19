/**
 * Main Application Component for MindHub
 * Integrates all migrated XAMPP functionality into Next.js
 * Updated to use Universal Scales Architecture
 */

'use client';

import React, { useState } from 'react';
import { useAuth, AuthProvider } from '../../hooks/useAuth';
import LoginForm from '../auth/LoginForm';
import PatientList from '../expedix/PatientList';
import { ReportsManager } from '../reports/ReportsManager';
import { Patient } from '../../hooks/usePatients';
import { ItemResponse } from '../../types/clinimetrix';
import { UniversalScalesProvider } from '../../contexts/UniversalScalesContext';
import { UniversalScalesGrid } from '../clinimetrix/UniversalScalesGrid';

type Section = 'dashboard' | 'expedix' | 'clinimetrix' | 'formx' | 'resources' | 'reports';

export const MainApp: React.FC = () => {
  const { authState, logout } = useAuth();
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <LoginForm />;
  }

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    // TODO: Navigate to patient detail view
    alert(`Ver paciente: ${patient.firstName} ${patient.lastName}`);
  };

  const handleEditPatient = (patient: Patient) => {
    // TODO: Open edit patient modal
    alert(`Editar paciente: ${patient.firstName} ${patient.lastName}`);
  };

  const handleStartAssessment = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentSection('clinimetrix');
    setShowAssessment(true);
  };

  const handleAssessmentComplete = (responses: ItemResponse[]) => {
    // TODO: Save assessment results
    console.log('Assessment completed:', responses);
    setShowAssessment(false);
    alert('Evaluación completada y guardada');
  };

  const handleAssessmentCancel = () => {
    setShowAssessment(false);
    setSelectedPatient(null);
  };

  const renderSidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-50 w-35 text-white transform ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
    style={{
      background: 'linear-gradient(135deg, #112F33 0%, #1a4247 100%)'
    }}>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="ml-2 text-xl font-bold">MindHub</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-md hover:bg-opacity-20 hover:bg-white transition-all duration-200"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav className="px-6 py-4">
        <ul className="space-y-2">
          {[
            { 
              id: 'dashboard', 
              label: 'Dashboard', 
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
            { 
              id: 'expedix', 
              label: 'Expedix', 
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              )
            },
            { 
              id: 'clinimetrix', 
              label: 'Clinimetrix', 
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              )
            },
            { 
              id: 'formx', 
              label: 'FormX', 
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )
            },
            { 
              id: 'resources', 
              label: 'Resources', 
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )
            },
            { 
              id: 'reports', 
              label: 'Reportes', 
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )
            }
          ].map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentSection(item.id as Section)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  currentSection === item.id
                    ? 'bg-white bg-opacity-20 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white border-opacity-20">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {authState.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{authState.user?.name}</p>
            <p className="text-xs text-gray-300">Usuario</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );

  const renderContent = () => {
    if (showAssessment) {
      return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Evaluación para {selectedPatient?.firstName} {selectedPatient?.lastName}
            </h1>
          </div>
          <SLUMSScaleComponent
            onComplete={handleAssessmentComplete}
            onCancel={handleAssessmentCancel}
          />
        </div>
      );
    }

    switch (currentSection) {
      case 'dashboard':
        return (
          <div style={{ minHeight: 'calc(100vh - 4rem)', padding: '1rem' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto' }}>

              {/* Welcome Header - Discreto */}
              <div style={{ 
                background: 'transparent',
                padding: '1rem 0',
                marginBottom: '1.5rem',
                borderBottom: '1px solid rgba(17, 47, 51, 0.1)'
              }}>
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: '#112F33', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ¡Bienvenido {authState.user?.name || 'Usuario'}!
                  <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20a6 6 0 0 0-12 0"/>
                    <circle cx="12" cy="10" r="4"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </h1>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '1rem', 
                  fontSize: '0.85rem', 
                  color: '#64748b' 
                }}>
                  <span>Plan actual: <strong style={{ color: '#29A98C' }}>Profesional</strong></span>
                  <span>Miembro desde: <strong>Enero 2024</strong></span>
                  <span>Especialidad: <strong>Psicología Clínica</strong></span>
                </div>
              </div>

              {/* Stats Cards - 6 específicas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  boxShadow: '0 4px 12px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }} onClick={() => setCurrentSection('expedix')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#29A98C" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="m22 21-3-3m2-4a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
                    </svg>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                      12
                    </p>
                  </div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Pacientes Activos
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    Registros activos
                  </p>
                </div>

                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  boxShadow: '0 4px 12px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }} onClick={() => setCurrentSection('clinimetrix')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EC7367" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                      <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V5z"/>
                    </svg>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                      89
                    </p>
                  </div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Evaluaciones Totales del Mes
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    +12 vs mes anterior
                  </p>
                </div>

                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  boxShadow: '0 4px 12px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }} onClick={() => setCurrentSection('clinimetrix')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#29A98C" strokeWidth="2">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                      <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                      <path d="m9 14 2 2 4-4"/>
                    </svg>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                      3
                    </p>
                  </div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Evaluaciones Hoy
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    En progreso
                  </p>
                </div>

                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  boxShadow: '0 4px 12px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }} onClick={() => setCurrentSection('expedix')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/>
                      <line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                      5
                    </p>
                  </div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Nuevos Pacientes del Mes
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    Registros recientes
                  </p>
                </div>

                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  boxShadow: '0 4px 12px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }} onClick={() => setCurrentSection('formx')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                      <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                      24
                    </p>
                  </div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Formas Realizadas
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    Total FormX
                  </p>
                </div>

                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  boxShadow: '0 4px 12px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }} onClick={() => setCurrentSection('expedix')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                      12
                    </p>
                  </div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Expedientes Activos
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    Total activos
                  </p>
                </div>
              </div>

              {/* Main Content Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                
                {/* Escalas Favoritas */}
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '2rem', 
                  boxShadow: '0 8px 24px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold', 
                    color: '#112F33', 
                    marginBottom: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    cursor: 'pointer'
                  }} onClick={() => setCurrentSection('clinimetrix')}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC7367" strokeWidth="2">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
                      <path d="M12 5L8 21l4-7 4 7-4-16"/>
                    </svg>
                    Escalas Favoritas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ 
                      padding: '1rem', 
                      borderRadius: '10px', 
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '0.875rem'
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem' }}>
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
                      </svg>
                      <p style={{ margin: 0, fontWeight: '500' }}>Aquí aparecerán tus escalas favoritas</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>Basado en tu uso del mes</p>
                    </div>
                    <button 
                      onClick={() => setCurrentSection('clinimetrix')}
                      style={{ 
                        padding: '0.75rem', 
                        backgroundColor: 'transparent', 
                        color: '#29A98C', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Ver todas las escalas →
                    </button>
                  </div>
                </div>

                {/* Actividad Reciente */}
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '2rem', 
                  boxShadow: '0 8px 24px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold', 
                    color: '#112F33', 
                    marginBottom: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    cursor: 'pointer'
                  }} onClick={() => setCurrentSection('reports')}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#112F33" strokeWidth="2">
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    Actividad Reciente
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#29A98C', 
                        borderRadius: '50%' 
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', color: '#112F33', fontWeight: '500', margin: 0 }}>
                          📋 PHQ-9 completado
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                          María González • hace 2 horas
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#EC7367', 
                        borderRadius: '50%' 
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', color: '#112F33', fontWeight: '500', margin: 0 }}>
                          ⚠️ Alerta de riesgo suicida
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                          Carlos Rodríguez • hace 4 horas
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#29A98C', 
                        borderRadius: '50%' 
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', color: '#112F33', fontWeight: '500', margin: 0 }}>
                          👥 Nuevo paciente registrado
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                          Juan Pérez • ayer
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setCurrentSection('reports')}
                      style={{ 
                        padding: '0.75rem', 
                        backgroundColor: 'transparent', 
                        color: '#29A98C', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        textAlign: 'center',
                        marginTop: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Ver historial completo →
                    </button>
                  </div>
                </div>

                {/* Tiempo de Uso */}
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '2rem', 
                  boxShadow: '0 8px 24px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold', 
                    color: '#112F33', 
                    marginBottom: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    Tiempo de Uso
                  </h3>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                      42h
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
                      Este mes
                    </p>
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: '#f1f5f9', 
                        borderRadius: '4px', 
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: '68%', 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #29A98C 0%, #3B82F6 100%)',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
                        68% vs mes anterior
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uso del Plan */}
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '2rem', 
                  boxShadow: '0 8px 24px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold', 
                    color: '#112F33', 
                    marginBottom: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                      <path d="M12 2v20m8-10H4"/>
                    </svg>
                    Uso del Plan
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Escalas restantes</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#112F33' }}>127/200</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Pacientes restantes</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#112F33' }}>88/100</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Formas restantes</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#112F33' }}>476/500</span>
                    </div>
                    <div style={{ 
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#166534', margin: 0, fontWeight: '500' }}>
                        ✓ Plan Profesional - Renovación automática
                      </p>
                    </div>
                  </div>
                </div>

                {/* Consultas del Mes */}
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '2rem', 
                  boxShadow: '0 8px 24px rgba(17, 47, 51, 0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold', 
                    color: '#112F33', 
                    marginBottom: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    cursor: 'pointer'
                  }} onClick={() => setCurrentSection('expedix')}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="m22 21-3-3m2-4a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
                    </svg>
                    Consultas del Mes
                  </h3>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                      28
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
                      Consultas en Expedix
                    </p>
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '0.75rem', 
                        color: '#64748b',
                        marginBottom: '0.5rem'
                      }}>
                        <span>Semana pasada</span>
                        <span>7 consultas</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '0.75rem', 
                        color: '#64748b'
                      }}>
                        <span>Promedio diario</span>
                        <span>1.2 consultas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'expedix':
        return (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Expedix - Gestión de Pacientes</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nuevo Paciente
                </button>
              </div>
              
              <PatientList
                onViewPatient={handleViewPatient}
                onEditPatient={handleEditPatient}
                onStartAssessment={handleStartAssessment}
              />
            </div>
          </div>
        );

      case 'clinimetrix':
        return (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Clinimetrix - Evaluaciones Clínicas</h1>
              
              <UniversalScalesGrid />
            </div>
          </div>
        );

      case 'reports':
        return <ReportsManager />;

      case 'formx':
        return (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">FormX - Constructor de Formularios</h1>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-yellow-800">
                  El módulo FormX está en desarrollo. Pronto podrás crear formularios personalizados.
                </p>
              </div>
            </div>
          </div>
        );

      case 'resources':
        return (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Resources - Biblioteca de Recursos</h1>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <p className="text-purple-800">
                  La biblioteca de recursos psicoeducativos está en desarrollo.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <UniversalScalesProvider>
      <div className="min-h-screen flex" style={{ backgroundColor: '#FFF8EE' }}>
        {renderSidebar()}
        
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #112F33 0%, #1a4247 100%)'
          }}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Main content area */}
        <div className="flex-1 lg:ml-0">
          <main className="min-h-screen">
            {renderContent()}
          </main>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </UniversalScalesProvider>
  );
};

export default MainApp;