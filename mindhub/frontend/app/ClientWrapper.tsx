'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Check if we're on the root path and user has preferences
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // User is logged in, redirect to app
        router.push('/app');
      }
    }
  }, [router]);

  return <>{children}</>;
}