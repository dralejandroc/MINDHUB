'use client';

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';

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
    <UnifiedSidebar currentUser={currentUser}>
      {children}
    </UnifiedSidebar>
  );
}