'use client';

// import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { redirect } from 'next/navigation';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // const { isLoaded, isSignedIn } = useAuth();
  
  // Mock values for now - replace with Supabase Auth later
  const isLoaded = true;
  const isSignedIn = true;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    redirect('/sign-in');
  }

  return <>{children}</>;
}