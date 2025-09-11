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
      try {
        console.log('🔍 [AuthProvider] Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ [AuthProvider] Error getting session:', error)
        }
        
        console.log('📊 [AuthProvider] Initial session result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userId: session?.user?.id 
        })
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('💥 [AuthProvider] Error in getInitialSession:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 [AuthProvider] Auth event: ${event}, has session: ${!!session}`)
        
        if (session?.user) {
          console.log('👤 [AuthProvider] User details:', {
            id: session.user.id,
            email: session.user.email,
            accessToken: !!session.access_token
          })
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ [AuthProvider] User signed in successfully')
          
          // Only redirect if we're on an auth page to avoid conflicts
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/')) {
            console.log('🔄 [AuthProvider] SIGNED_IN on auth page, redirecting...')
            const urlParams = new URLSearchParams(window.location.search)
            const redirectTo = urlParams.get('redirectTo') || '/app'
            console.log('🎯 [AuthProvider] SIGNED_IN redirect to:', redirectTo)
            window.location.href = redirectTo
          }
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('🚪 [AuthProvider] User signed out, redirecting to sign-in')
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