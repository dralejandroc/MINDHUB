'use client';

import { useState, useEffect } from 'react';
import AuthTestComponent from '@/components/debug/AuthTestComponent';

interface HealthCheck {
  success: boolean;
  backend?: {
    url: string;
    status?: number;
    statusText?: string;
    body?: string;
    error?: string;
    type?: string;
  };
  timestamp: string;
}

export default function DebugPage() {
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health/backend');
      const data = await response.json();
      setHealthCheck(data);
    } catch (error) {
      setHealthCheck({
        success: false,
        backend: {
          url: 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'FETCH_ERROR'
        },
        timestamp: new Date().toISOString()
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const testBetaRegistration = async () => {
    const testData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'testpassword123',
      confirmPassword: 'testpassword123',
      professionalType: 'psicologo',
      city: 'Test City',
      country: 'mexico',
      howDidYouHear: 'google',
      yearsOfPractice: '1_3',
      specialization: 'Test',
      expectations: 'Test expectations'
    };

    // Beta registration test removed - using Auth authentication only
    console.log('Beta registration test disabled - legacy auth system removed');
    return { success: false, message: 'Beta registration disabled - using Auth auth only' };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">MindHub Debug Dashboard</h1>
        
        {/* Environment Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">NODE_ENV</p>
              <p className="font-mono text-sm">{process.env.NODE_ENV || 'undefined'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">NEXT_PUBLIC_APP_URL</p>
              <p className="font-mono text-sm">{process.env.NEXT_PUBLIC_APP_URL || 'undefined'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">NEXT_PUBLIC_API_URL</p>
              <p className="font-mono text-sm">{process.env.NEXT_PUBLIC_API_URL || 'undefined'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">NEXT_PUBLIC_ENVIRONMENT</p>
              <p className="font-mono text-sm">{process.env.NEXT_PUBLIC_ENVIRONMENT || 'undefined'}</p>
            </div>
          </div>
        </div>

        {/* Backend Health Check */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Backend Health Check</h2>
            <button
              onClick={runHealthCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Run Check'}
            </button>
          </div>
          
          {healthCheck && (
            <div className={`p-4 rounded-lg ${healthCheck.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${healthCheck.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">
                  {healthCheck.success ? 'Backend Connected' : 'Backend Connection Failed'}
                </span>
              </div>
              
              {healthCheck.backend && (
                <div className="mt-4 space-y-2">
                  <p><strong>URL:</strong> {healthCheck.backend.url}</p>
                  {healthCheck.backend.status && (
                    <p><strong>Status:</strong> {healthCheck.backend.status} {healthCheck.backend.statusText}</p>
                  )}
                  {healthCheck.backend.error && (
                    <p><strong>Error:</strong> {healthCheck.backend.error}</p>
                  )}
                  {healthCheck.backend.type && (
                    <p><strong>Type:</strong> {healthCheck.backend.type}</p>
                  )}
                </div>
              )}
              
              <p className="text-sm text-gray-500 mt-2">
                Last checked: {new Date(healthCheck.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Test Registration */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Beta Registration API</h2>
          <button
            onClick={async () => {
              const result = await testBetaRegistration();
              alert(`Test result: ${JSON.stringify(result, null, 2)}`);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Test Beta Registration
          </button>
          <p className="text-sm text-gray-500 mt-2">
            This will test the beta registration API with dummy data
          </p>
        </div>

        {/* Authentication Test */}
        <AuthTestComponent />

        {/* PWA Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">PWA Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Service Worker:</strong>{' '}
              <span className={`px-2 py-1 rounded text-sm ${'serviceWorker' in navigator ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}
              </span>
            </p>
            <p>
              <strong>Manifest:</strong>{' '}
              <a href="/manifest.json" target="_blank" className="text-blue-600 hover:underline">
                View Manifest
              </a>
            </p>
            <p>
              <strong>Icons:</strong>{' '}
              <span className="space-x-2">
                <a href="/icon-192x192.png" target="_blank" className="text-blue-600 hover:underline">192x192</a>
                <a href="/icon-512x512.png" target="_blank" className="text-blue-600 hover:underline">512x512</a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}