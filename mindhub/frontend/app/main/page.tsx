'use client';

import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function MainPage() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        // Check if there's a token in localStorage (for custom auth)
        const token = localStorage.getItem('auth_token');
        if (!token) {
          redirect('/sign-in');
        } else {
          // User has token, check for preferred start page
          const userMetrics = localStorage.getItem('userMetrics');
          if (userMetrics) {
            try {
              const metrics = JSON.parse(userMetrics);
              const startPage = metrics.dashboardConfig?.startPage;
              if (startPage && startPage !== 'dashboard') {
                redirect(`/hubs/${startPage}`);
              } else {
                redirect('/app');
              }
            } catch {
              redirect('/app');
            }
          } else {
            redirect('/app');
          }
        }
      } else {
        // Check for preferred start page
        const userMetrics = localStorage.getItem('userMetrics');
        if (userMetrics) {
          try {
            const metrics = JSON.parse(userMetrics);
            const startPage = metrics.dashboardConfig?.startPage;
            if (startPage && startPage !== 'dashboard') {
              redirect(`/hubs/${startPage}`);
            } else {
              redirect('/app');
            }
          } catch {
            redirect('/app');
          }
        } else {
          redirect('/app');
        }
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