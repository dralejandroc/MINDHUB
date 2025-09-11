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
    console.log('📊 [APP PAGE] Auth state check:', { 
      loading, 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.email 
    });
    
    if (!loading && !user) {
      console.log('❌ [APP PAGE] No user found after loading complete, redirecting to sign-in');
      router.replace('/auth/sign-in');
    } else if (!loading && user) {
      console.log('✅ [APP PAGE] User authenticated successfully:', {
        id: user.id,
        email: user.email
      });
    } else if (loading) {
      console.log('⏳ [APP PAGE] Still loading auth state...');
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

  // Show loading spinner while auth is being determined
  if (loading) {
    console.log('⏳ [APP PAGE] Rendering loading spinner while determining auth state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show loading if no user (will redirect via useEffect)
  if (!user) {
    console.log('🔒 [APP PAGE] No user, showing loading while redirect happens');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  console.log('✅ [APP PAGE] Rendering dashboard for authenticated user:', user.email);

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