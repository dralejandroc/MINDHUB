'use client';

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { DashboardSwitcher } from '@/components/dashboard/DashboardSwitcher';
import { StartPageHandler } from '@/components/layout/StartPageHandler';
import { UserMetricsProvider } from '@/contexts/UserMetricsContext';

export default function Home() {
  const currentUser = {
    name: 'Administrador',
    email: 'admin@mindhub.com',
    role: 'professional'
  };

  return (
    <UserMetricsProvider>
      <UnifiedSidebar currentUser={currentUser}>
        <DashboardSwitcher />
        <StartPageHandler />
      </UnifiedSidebar>
    </UserMetricsProvider>
  );
}