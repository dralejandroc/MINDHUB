'use client';

import { useAuth } from '@/lib/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && !hasRedirected.current) {
      hasRedirected.current = true;

      if (!user) {
        router.replace('/auth/sign-in');
      } else {
        router.replace('/app');
      }
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}