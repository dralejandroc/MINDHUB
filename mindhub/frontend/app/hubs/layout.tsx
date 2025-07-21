'use client';

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { UserMetricsProvider } from '@/contexts/UserMetricsContext';

export default function HubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = {
    name: 'Administrador',
    email: 'admin@mindhub.com',
    role: 'professional'
  };

  return (
    <UserMetricsProvider>
      <UnifiedSidebar currentUser={currentUser}>
        {children}
      </UnifiedSidebar>
    </UserMetricsProvider>
  );
}