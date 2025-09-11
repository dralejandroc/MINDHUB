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
    console.log('📊 App page - Auth state:', { loading, user: !!user, userId: user?.id });
    
    // TEMPORARILY DISABLED - Allow access without auth for testing
    console.log('🚫 [APP PAGE] TEMPORARILY DISABLED - Skipping user auth check');
    
    if (!loading && !user) {
      // DISABLED: Redirect to sign-in if not authenticated with Supabase
      console.log('🔓 [APP PAGE] No user found, but AUTH CHECK IS DISABLED - allowing access');
      // router.replace('/auth/sign-in');
    } else if (!loading && user) {
      console.log('✅ User authenticated, showing app dashboard');
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

  // TEMPORARILY DISABLED - Allow access without user for testing
  console.log('🚫 [APP PAGE] Rendering dashboard regardless of user auth status');
  
  // DISABLED: If not signed in with Supabase, show loading
  // if (!user) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <LoadingSpinner size="lg" />
  //     </div>
  //   );
  // }

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