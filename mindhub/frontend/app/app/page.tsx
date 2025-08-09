'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { DashboardSwitcher } from '@/components/dashboard/DashboardSwitcher';
import { StartPageHandler } from '@/components/layout/StartPageHandler';
import { UserMetricsProvider } from '@/contexts/UserMetricsContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AppHome() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Redirect to sign-in if not authenticated with Clerk
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Reset dashboard config if it's broken
  useEffect(() => {
    if (isSignedIn) {
      const dashboardConfig = localStorage.getItem('userMetrics');
      if (dashboardConfig) {
        try {
          const config = JSON.parse(dashboardConfig);
          if (config.dashboardConfig?.theme === 'compact') {
            config.dashboardConfig.theme = 'default';
            localStorage.setItem('userMetrics', JSON.stringify(config));
          }
        } catch (error) {
          console.log('Resetting dashboard config due to error:', error);
          localStorage.removeItem('userMetrics');
        }
      }
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not signed in with Clerk, show loading
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <UserMetricsProvider>
      <UnifiedSidebar>
        <DashboardSwitcher />
        <StartPageHandler />
      </UnifiedSidebar>
    </UserMetricsProvider>
  );
}