/**
 * Authentication redirect utility
 * Checks if user is logged in and redirects to login if not
 */

export function checkAuthAndRedirect(): boolean {
  if (typeof window === 'undefined') return true;
  
  const user = localStorage.getItem('currentUser');
  const token = localStorage.getItem('authToken');
  
  if (!user || !token) {
    window.location.href = '/login';
    return false;
  }
  
  return true;
}

export function getUserFromStorage() {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user:', e);
    return null;
  }
}