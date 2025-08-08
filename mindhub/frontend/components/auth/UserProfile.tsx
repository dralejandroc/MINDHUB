'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return <LoadingSpinner size="sm" />;
  }

  if (!isSignedIn || !user) {
    return null;
  }

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
        <p className="text-xs text-gray-500">{user.emailAddresses[0]?.emailAddress}</p>
      </div>
      <button
        onClick={handleSignOut}
        className="text-gray-500 hover:text-gray-700 transition-colors"
        title="Cerrar sesión"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}