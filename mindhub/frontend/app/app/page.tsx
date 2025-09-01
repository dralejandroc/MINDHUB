'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/AuthProvider';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { ConfigurableDashboard } from '@/components/dashboard/ConfigurableDashboard';
import { StartPageHandler } from '@/components/layout/StartPageHandler';
import { UserMetricsProvider } from '@/contexts/UserMetricsContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AppHome() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to sign-in if not authenticated with Supabase
      router.push('/auth/sign-in');
    }
  }, [loading, user, router]);

  // Reset dashboard config if it's broken
  useEffect(() => {
    if (user) {
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
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not signed in with Supabase, show loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <UserMetricsProvider>
      <UnifiedSidebar>
        <div className="space-y-6">
          {/* Quick Actions */}
          <ConfigurableDashboard />
        </div>
        <StartPageHandler />
      </UnifiedSidebar>
    </UserMetricsProvider>
  );
}