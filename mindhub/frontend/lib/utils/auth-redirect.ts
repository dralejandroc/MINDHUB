/**
 * Authentication redirect utility
 * Now uses Clerk for authentication
 */
import { auth } from '@clerk/nextjs/server';

/**
 * @deprecated Use Clerk hooks instead
 */
export function checkAuthAndRedirect(): boolean {
  console.warn('checkAuthAndRedirect is deprecated - use Clerk hooks instead');
  return true;
}

/**
 * @deprecated Use Clerk useUser hook instead
 */
export function getUserFromStorage() {
  console.warn('getUserFromStorage is deprecated - use Clerk useUser hook instead');
  return null;
}