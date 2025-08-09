'use client';

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <UnifiedSidebar>
      {children}
    </UnifiedSidebar>
  );
}