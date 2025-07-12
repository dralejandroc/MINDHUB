'use client';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { useUser } from '@auth0/nextjs-auth0/client';
import HubNavigation from '@/components/layout/HubNavigation';

function HubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  // Convert Auth0 user to our format
  const currentUser = user ? {
    name: user.name || 'User',
    email: user.email || '',
    role: user['https://mindhub.com/role'] || 'professional'
  } : {
    name: 'Dr. Demo Professional',
    email: 'demo@mindhub.com',
    role: 'professional'
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HubNavigation 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default withPageAuthRequired(HubsLayout);