'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues
const UnifiedSidebar = dynamic(() => import('@/components/layout/UnifiedSidebar').then(mod => ({ default: mod.UnifiedSidebar })), { ssr: false });
const DashboardSwitcher = dynamic(() => import('@/components/dashboard/DashboardSwitcher').then(mod => ({ default: mod.DashboardSwitcher })), { ssr: false });
const StartPageHandler = dynamic(() => import('@/components/layout/StartPageHandler').then(mod => ({ default: mod.StartPageHandler })), { ssr: false });
const UserMetricsProvider = dynamic(() => import('@/contexts/UserMetricsContext').then(mod => ({ default: mod.UserMetricsProvider })), { ssr: false });

export default function AppHome() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!token || !savedUser) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    try {
      setCurrentUser(JSON.parse(savedUser));
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('auth_token');
      router.push('/login');
      return;
    }
    
    // Reset dashboard config if it's broken
    const dashboardConfig = localStorage.getItem('userMetrics');
    if (dashboardConfig) {
      try {
        const config = JSON.parse(dashboardConfig);
        if (config.dashboardConfig?.theme === 'compact') {
          // Reset to default theme
          config.dashboardConfig.theme = 'default';
          localStorage.setItem('userMetrics', JSON.stringify(config));
        }
      } catch (error) {
        console.log('Resetting dashboard config due to error:', error);
        localStorage.removeItem('userMetrics');
      }
    }

    setIsLoading(false);
  }, [router]);

  // Show loading state while user data loads
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <UserMetricsProvider>
      <UnifiedSidebar currentUser={currentUser}>
        <DashboardSwitcher />
        <StartPageHandler />
      </UnifiedSidebar>
    </UserMetricsProvider>
  );
}