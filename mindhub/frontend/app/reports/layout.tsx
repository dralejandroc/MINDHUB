'use client';

import { useState, useEffect } from 'react';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { CurrentUser } from '@/types/user-metrics';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | undefined>(undefined);

  useEffect(() => {
    // Read user from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      // Default fallback
      const defaultUser = {
        id: 'user-dr-alejandro',
        name: 'Dr. Alejandro Contreras',
        email: 'alejandro@mindhub.com',
        role: 'professional'
      };
      setCurrentUser(defaultUser);
      localStorage.setItem('currentUser', JSON.stringify(defaultUser));
    }
  }, []);

  // Show loading while user loads
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <UnifiedSidebar currentUser={currentUser}>
      {children}
    </UnifiedSidebar>
  );
}