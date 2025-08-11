'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { setGlobalTokenProvider } from '@/lib/api/expedix-client';

export default function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  
  useEffect(() => {
    // Set the global token provider for the API client
    setGlobalTokenProvider(getToken);
    
    console.log('✅ Global token provider initialized for Expedix API client');
  }, [getToken]);
  
  return <>{children}</>;
}