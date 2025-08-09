'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    // Check if we're on the root path and user is signed in
    if (isLoaded && typeof window !== 'undefined' && window.location.pathname === '/') {
      if (isSignedIn) {
        // User is logged in, redirect to app
        router.push('/app');
      }
    }
  }, [router, isSignedIn, isLoaded]);

  return <>{children}</>;
}