'use client';

import { useUser } from '@clerk/nextjs';

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useUser();

  return {
    isLoaded,
    isSignedIn,
    user,
    isLoading: !isLoaded
  };
}