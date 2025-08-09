'use client';

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { ProtectedLayout } from '@/components/auth/ProtectedLayout';

export default function HubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <UnifiedSidebar>
        {children}
      </UnifiedSidebar>
    </ProtectedLayout>
  );
}