/**
 * Cleanup utilities for Supabase session management and legacy Clerk data
 * Helps resolve cookie parsing issues and session corruption
 */

export const clearSupabaseSession = () => {
  if (typeof window === 'undefined') return

  // Clear all Supabase-related cookies and localStorage
  const cookiePrefix = 'sb-'
  const localStoragePrefix = 'sb-'
  
  // Clear localStorage
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(localStoragePrefix)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Unable to clear localStorage:', error)
  }

  // Clear sessionStorage  
  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(localStoragePrefix)) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Unable to clear sessionStorage:', error)
  }

  // Clear cookies
  try {
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      if (name.startsWith(cookiePrefix)) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
      }
    })
  } catch (error) {
    console.warn('Unable to clear cookies:', error)
  }
}

// Legacy Clerk cleanup function removed - no longer needed with Supabase-only auth

/**
 * Comprehensive cleanup that runs on app startup
 * Removes corrupted Supabase sessions
 */
export const performStartupCleanup = () => {
  if (typeof window === 'undefined') return

  try {
    // Check if there are corrupted Supabase sessions
    const hasSupabaseCookies = document.cookie.includes('sb-')
    if (hasSupabaseCookies) {
      try {
        // Try to parse Supabase cookies
        const cookies = document.cookie.split(';')
        const supabaseCookies = cookies.filter(cookie => cookie.trim().startsWith('sb-'))
        
        for (const cookie of supabaseCookies) {
          const [, value] = cookie.split('=')
          if (value) {
            try {
              // Try to decode the cookie value
              const decoded = decodeURIComponent(value.trim())
              if (decoded.startsWith('{') || decoded.startsWith('[')) {
                JSON.parse(decoded)
              }
            } catch (error) {
              console.log('🧹 Found corrupted Supabase cookie, clearing all...')
              clearSupabaseSession()
              break
            }
          }
        }
      } catch (error) {
        console.log('🧹 Error checking Supabase cookies, clearing all...')
        clearSupabaseSession()
      }
    }
  } catch (error) {
    console.warn('Startup cleanup error:', error)
  }
}

export const handleSupabaseAuthError = (error: any) => {
  console.warn('Supabase auth error detected:', error)
  
  // If it's a cookie parsing error or invalid session, clear everything
  if (
    error?.message?.includes('parse') ||
    error?.message?.includes('JSON') ||
    error?.message?.includes('cookie') ||
    error?.message?.includes('Invalid session')
  ) {
    console.log('Clearing corrupted Supabase session data...')
    clearSupabaseSession()
    
    // Reload the page to start fresh
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }
}