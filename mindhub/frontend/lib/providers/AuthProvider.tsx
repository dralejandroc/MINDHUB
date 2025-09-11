'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 [AuthProvider] Auth event: ${event}, has session: ${!!session}`)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle redirects on auth state change
        if (event === 'SIGNED_IN' && session) {
          console.log('🚀 [AuthProvider] User signed in, checking for redirect')
          
          // Check if we're on a login page and should redirect
          const currentPath = window.location.pathname
          if (currentPath.startsWith('/auth/')) {
            console.log('🔄 [AuthProvider] On auth page, redirecting to /app')
            
            // Check for redirectTo parameter
            const urlParams = new URLSearchParams(window.location.search)
            const redirectTo = urlParams.get('redirectTo') || '/app'
            
            console.log('🎯 [AuthProvider] Redirecting to:', redirectTo)
            
            // Wait longer for cookies to be set, then verify session before redirect
            const attemptRedirect = async (attempt = 1, maxAttempts = 5) => {
              console.log(`🔍 [AuthProvider] Redirect attempt ${attempt}/${maxAttempts}`)
              
              try {
                // Verify session is actually saved
                const { data: { session: currentSession } } = await supabase.auth.getSession()
                
                if (currentSession && currentSession.user) {
                  console.log('✅ [AuthProvider] Session confirmed, redirecting')
                  window.location.href = redirectTo
                } else if (attempt < maxAttempts) {
                  console.log('⏳ [AuthProvider] Session not ready, waiting...')
                  setTimeout(() => attemptRedirect(attempt + 1, maxAttempts), 1000)
                } else {
                  console.error('❌ [AuthProvider] Session verification failed after all attempts')
                  // Force redirect anyway as fallback
                  window.location.href = redirectTo
                }
              } catch (error) {
                console.error('❌ [AuthProvider] Error verifying session:', error)
                if (attempt < maxAttempts) {
                  setTimeout(() => attemptRedirect(attempt + 1, maxAttempts), 1000)
                } else {
                  window.location.href = redirectTo
                }
              }
            }
            
            // Start redirect attempts after initial delay
            setTimeout(() => attemptRedirect(), 1000)
          }
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('🚪 [AuthProvider] User signed out, redirecting to home')
          window.location.href = '/auth/sign-in'
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
  }

  const value = {
    user,
    session,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}