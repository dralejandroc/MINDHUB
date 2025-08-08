'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string; role?: string; } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!token || !savedUser) {
      // Redirect to login if not authenticated
      router.push('/sign-in');
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser({
        name: parsedUser.name,
        email: parsedUser.email,
        role: parsedUser.role
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('auth_token');
      router.push('/sign-in');
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <UnifiedSidebar currentUser={currentUser}>
      {children}
    </UnifiedSidebar>
  );
}