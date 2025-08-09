/**
 * @deprecated Use Clerk's useUser hook instead
 * This hook is deprecated and should not be used
 */

import { useUser } from '@clerk/nextjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  specialty?: string;
  avatarUrl?: string;
}

/**
 * @deprecated Use Clerk's useUser hook instead
 */
export function useCurrentUser() {
  console.warn('useCurrentUser is deprecated - use Clerk\'s useUser hook instead');
  
  const { user: clerkUser, isLoaded } = useUser();
  
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.firstName || 'Usuario',
    role: 'user',
    avatarUrl: clerkUser.imageUrl
  } : null;

  return { 
    user, 
    loading: !isLoaded, 
    refetch: () => console.warn('refetch is deprecated - Clerk manages auth state')
  };
}