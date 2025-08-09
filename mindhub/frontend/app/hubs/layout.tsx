'use client';

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { ProtectedLayout } from '@/components/auth/ProtectedLayout';
import { useAuth } from '@/hooks/useAuth';
import { CurrentUser } from '@/types/user-metrics';

export default function HubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Transform Clerk user to expected format
  const currentUser: CurrentUser | undefined = user ? {
    name: user.fullName || `${user.firstName} ${user.lastName}`,
    email: user.emailAddresses[0]?.emailAddress,
    role: 'user'
  } : undefined;

  return (
    <ProtectedLayout>
      <UnifiedSidebar currentUser={currentUser}>
        {children}
      </UnifiedSidebar>
    </ProtectedLayout>
  );
}