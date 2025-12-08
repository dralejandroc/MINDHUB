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

        // 🔓 DESARROLLO LOCAL: Bypass temporal de autenticación
        if (process.env.NODE_ENV === 'development') {
          const devUser = localStorage.getItem('dev_bypass_user')
          if (devUser === 'dr_aleks_c@hotmail.com') {
            console.log('🔓 [DEV] Bypass de autenticación activado - mock user')
            const mockUser = {
              id: 'dev-user-id-12345',
              email: 'dr_aleks_c@hotmail.com',
              app_metadata: { provider: 'email' },
              user_metadata: { name: 'Dr. Alejandro' },
              aud: 'authenticated',
              role: 'authenticated',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              email_confirmed_at: new Date().toISOString(),
              phone: '',
              confirmed_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString(),
              identities: [],
              factors: []
            } as User

            const mockSession = {
              user: mockUser,
              access_token: 'dev-bypass-token-' + Date.now(),
              refresh_token: 'dev-bypass-refresh-token',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer'
            } as Session

            setUser(mockUser)
            setSession(mockSession)
            setLoading(false)
            console.log('✅ [DEV] Mock user and session created successfully')
            return
          }
        }

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
          // Let sign-in page handle redirects to avoid conflicts
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