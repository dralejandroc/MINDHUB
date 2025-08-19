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

/**
 * Clear ALL legacy Clerk cookies and data - SECURITY CRITICAL
 * This removes all traces of the old authentication system
 */
export const clearLegacyClerkData = () => {
  if (typeof window === 'undefined') return

  console.log('🔒 Clearing legacy Clerk authentication data for security...')

  // Known Clerk cookie patterns
  const clerkCookiePatterns = [
    '__client_uat',
    '__session',
    '__clerk_active_context',
    '__clerk_user_id',
    '__clerk_session',
    '__clerk_jwt_template',
    'clerk-',
    '_clerk_'
  ]

  // Known Clerk localStorage patterns
  const clerkLocalStoragePatterns = [
    'clerk_',
    '__clerk_',
    'clerk-js',
    'clerk_user',
    'clerk_session'
  ]

  // Clear localStorage
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      const shouldClear = clerkLocalStoragePatterns.some(pattern => 
        key.startsWith(pattern) || key.includes('clerk')
      )
      if (shouldClear) {
        localStorage.removeItem(key)
        console.log(`✅ Removed localStorage: ${key}`)
      }
    })
  } catch (error) {
    console.warn('Unable to clear localStorage:', error)
  }

  // Clear sessionStorage
  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      const shouldClear = clerkLocalStoragePatterns.some(pattern => 
        key.startsWith(pattern) || key.includes('clerk')
      )
      if (shouldClear) {
        sessionStorage.removeItem(key)
        console.log(`✅ Removed sessionStorage: ${key}`)
      }
    })
  } catch (error) {
    console.warn('Unable to clear sessionStorage:', error)
  }

  // Clear ALL Clerk cookies
  try {
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      
      const shouldClear = clerkCookiePatterns.some(pattern => 
        name.includes(pattern) || name.startsWith(pattern) || 
        name.includes('clerk') || name.includes('__client') || 
        name.includes('__session')
      )
      
      if (shouldClear) {
        // Clear for current domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        // Clear for parent domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
        // Clear for root domain
        const rootDomain = window.location.hostname.split('.').slice(-2).join('.')
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${rootDomain}`
        console.log(`✅ Cleared Clerk cookie: ${name}`)
      }
    })
  } catch (error) {
    console.warn('Unable to clear cookies:', error)
  }

  console.log('✅ Legacy Clerk data cleanup completed')
}

/**
 * Comprehensive cleanup that runs on app startup
 * Removes both corrupted Supabase sessions AND legacy Clerk data
 */
export const performStartupCleanup = () => {
  if (typeof window === 'undefined') return

  try {
    // Always clear legacy Clerk data for security
    clearLegacyClerkData()
    
    // Check if there are corrupted Supabase sessions
    const hasSupabaseCookies = document.cookie.includes('sb-')
    if (hasSupabaseCookies) {
      try {
        // Try to parse Supabase cookies
        const cookies = document.cookie.split(';')
        const supabaseCookies = cookies.filter(cookie => cookie.trim().startsWith('sb-'))
        
        for (const cookie of supabaseCookies) {
          const [name, value] = cookie.split('=')
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