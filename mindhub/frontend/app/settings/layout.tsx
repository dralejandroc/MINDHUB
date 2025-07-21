'use client';

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';

export default function SettingsLayout({
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