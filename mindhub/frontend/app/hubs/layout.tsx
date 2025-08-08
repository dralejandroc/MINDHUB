'use client';

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { ProtectedLayout } from '@/components/auth/ProtectedLayout';
import { useAuth } from '@/hooks/useAuth';

export default function HubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Transform Clerk user to expected format
  const currentUser = user ? {
    id: user.id,
    name: user.fullName || `${user.firstName} ${user.lastName}`,
    email: user.emailAddresses[0]?.emailAddress,
    role: 'user'
  } : null;

  return (
    <ProtectedLayout>
      <UnifiedSidebar currentUser={currentUser}>
        {children}
      </UnifiedSidebar>
    </ProtectedLayout>
  );
}