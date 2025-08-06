'use client';

import { useState, useEffect } from 'react';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';

export default function HubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Read user from localStorage - NO HARDCODED DATA
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
        window.location.href = '/login';
      }
    } else {
      // No user found, redirect to login
      window.location.href = '/login';
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