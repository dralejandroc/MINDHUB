'use client';

import { useState, useEffect } from 'react';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { DashboardSwitcher } from '@/components/dashboard/DashboardSwitcher';
import { StartPageHandler } from '@/components/layout/StartPageHandler';
import { UserMetricsProvider } from '@/contexts/UserMetricsContext';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is stored in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      // Default fallback if no user is stored
      // Redirect to login if no user
      router.push('/login');
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
  }, []);

  // Show loading state while user data loads
  if (!currentUser) {
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