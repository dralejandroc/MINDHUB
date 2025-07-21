'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentUser = user ? {
    name: user.name || 'Usuario',
    email: user.email || '',
    role: 'user'
  } : undefined;

  return (
    <UnifiedSidebar currentUser={currentUser}>
      {children}
    </UnifiedSidebar>
  );
}