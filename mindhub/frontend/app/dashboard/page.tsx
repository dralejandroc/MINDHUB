'use client';

import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        // User not signed in with Clerk, redirect to sign-in
        redirect('/sign-in');
      } else {
        // User is signed in with Clerk, redirect to app dashboard
        redirect('/app');
      }
    }
  }, [isLoaded, isSignedIn]);

  // Always show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}