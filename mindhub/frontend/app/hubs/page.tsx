'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HubsHomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoaded && !hasRedirected.current) {
      hasRedirected.current = true;
      
      if (!isSignedIn) {
        router.replace('/auth/sign-in');
      } else {
        router.replace('/app');
      }
    }
  }, [isLoaded, isSignedIn, router]);

  return (
     <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-100 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}