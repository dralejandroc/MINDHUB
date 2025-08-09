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
        // No Clerk auth, check MindHub token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          redirect('/sign-in'); // No auth at all
        } else {
          redirect('/app'); // Has MindHub token
        }
      } else {
        // Has Clerk auth, redirect to app
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