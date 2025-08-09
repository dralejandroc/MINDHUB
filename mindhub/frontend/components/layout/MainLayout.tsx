'use client';

import { useAuth } from '@clerk/nextjs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect to sign-in
  }

  return (
    <UnifiedSidebar>
      {children}
    </UnifiedSidebar>
  );
}