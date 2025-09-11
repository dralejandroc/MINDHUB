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
            
            // Force navigation
            setTimeout(() => {
              window.location.href = redirectTo
            }, 500)
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