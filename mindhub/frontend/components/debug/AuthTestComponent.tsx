'use client';

import { useState } from 'react';
// // import { useAuth, useUser } from '@supabase/nextjs';
import { useExpedixApi } from '@/lib/api/expedix-client';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function AuthTestComponent() {
  // const { isLoaded, isSignedIn, getToken } = useAuth();
  // const { user } = useUser();
  const expedixApi = useExpedixApi();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Mock values for now
  const isLoaded = true;
  const isSignedIn = true;
  const user = { emailAddresses: [{ emailAddress: 'demo@mindhub.com' }] };
  const getToken = async () => 'mock-token';

  const updateResult = (test: string, status: TestResult['status'], message: string, data?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.test === test);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      } else {
        return [...prev, { test, status, message, data }];
      }
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Check Auth authentication status
    updateResult('Auth Auth Status', 'pending', 'Checking authentication...');
    try {
      if (!isLoaded) {
        updateResult('Auth Auth Status', 'error', 'Auth not loaded');
        return;
      }
      if (!isSignedIn) {
        updateResult('Auth Auth Status', 'error', 'User not signed in');
        return;
      }
      updateResult('Auth Auth Status', 'success', `User signed in: ${user?.emailAddresses?.[0]?.emailAddress}`);
    } catch (error) {
      updateResult('Auth Auth Status', 'error', `Error: ${error}`);
      return;
    }

    // Test 2: Get Auth token
    updateResult('Token Generation', 'pending', 'Getting Auth token...');
    let token: string | null = null;
    try {
      token = await getToken();
      if (token) {
        updateResult('Token Generation', 'success', `Token received (${token.length} chars)`, { 
          tokenPreview: token.substring(0, 20) + '...'
        });
      } else {
        updateResult('Token Generation', 'error', 'No token received');
        return;
      }
    } catch (error) {
      updateResult('Token Generation', 'error', `Error getting token: ${error}`);
      return;
    }

    // Test 3: Test direct backend call with token
    updateResult('Direct Backend Call', 'pending', 'Testing direct backend API call...');
    try {
      const response = await fetch('/api/expedix/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        updateResult('Direct Backend Call', 'success', `Backend call successful (${data.data?.length || 0} patients)`, data);
      } else {
        updateResult('Direct Backend Call', 'error', `Backend error: ${data.message || 'Unknown error'}`, data);
      }
    } catch (error) {
      updateResult('Direct Backend Call', 'error', `Network error: ${error}`);
    }

    // Test 4: Test via API client
    updateResult('API Client Call', 'pending', 'Testing via Expedix API client...');
    try {
      const apiResponse = await expedixApi.getPatients();
      updateResult('API Client Call', 'success', `API client successful (${apiResponse.data.length} patients)`, apiResponse);
    } catch (error) {
      updateResult('API Client Call', 'error', `API client error: ${error}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Authentication Flow Test</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          This component tests the complete authentication flow from Auth to the backend API.
        </p>
      </div>

      <div className="mb-4">
        <button
          onClick={runTests}
          disabled={isRunning || !isLoaded}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run Authentication Tests'}
        </button>
      </div>

      {/* Current Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h3 className="font-medium mb-2">Current Status:</h3>
        <ul className="text-sm space-y-1">
          <li>Auth Loaded: {isLoaded ? '✅' : '❌'}</li>
          <li>User Signed In: {isSignedIn ? '✅' : '❌'}</li>
          <li>User Email: {user?.emailAddresses?.[0]?.emailAddress || 'N/A'}</li>
        </ul>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Test Results:</h3>
          {results.map((result, index) => (
            <div key={index} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{result.test}</span>
                <span className={`${getStatusColor(result.status)} text-lg`}>
                  {getStatusIcon(result.status)}
                </span>
              </div>
              <p className={`text-sm ${getStatusColor(result.status)}`}>
                {result.message}
              </p>
              {result.data && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">View details</summary>
                  <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}