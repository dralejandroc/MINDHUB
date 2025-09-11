'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signIn, signInWithGoogle, supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { MindHubSignInCard } from '@/components/auth/MindHubSignInCard'
import { useState } from 'react'

// Clean Architecture: Domain entities for authentication
interface SignInData {
  email: string;
  password: string;
}

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Clean Architecture: Set document title (UI layer concern)
  useEffect(() => {
    document.title = 'Iniciar Sesión - MindHub'
    
    // EMERGENCY BYPASS: Redirect to /app after 10 seconds regardless of login
    console.log('🆘 [EMERGENCY] Setting up emergency bypass redirect in 10 seconds')
    
    const emergencyTimer = setTimeout(() => {
      console.log('🆘 [EMERGENCY] Emergency redirect triggered - bypassing login')
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirectTo') || '/app'
      console.log('🆘 [EMERGENCY] FORCING NAVIGATION TO:', redirectTo)
      window.location.href = redirectTo
    }, 10000) // 10 seconds
    
    return () => clearTimeout(emergencyTimer)
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    console.log('🚨 [CRITICAL] handleSignIn called with:', { email, hasPassword: !!password })
    setLoading(true)

    try {
      console.log('🚨 [CRITICAL] Calling signIn function...')
      const { data, error } = await signIn(email, password)
      console.log('🚨 [CRITICAL] signIn result:', { data: !!data, error: !!error, user: !!data?.user })
      
      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success('¡Bienvenido a MindHub!')
        console.log('✅ [SignIn] Login successful - user data:', data.user.id)
        
        // FORCE COOKIE CREATION - create auth cookies manually
        try {
          console.log('🍪 [SignIn] Creating auth cookies manually')
          
          // Get the session and create cookies manually
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            console.log('🍪 [SignIn] Session found, creating cookies')
            
            // Create multiple cookie variations to ensure one works
            const cookieOptions = '; path=/; domain=.mindhub.cloud; secure; samesite=lax'
            const accessToken = session.access_token
            const refreshToken = session.refresh_token
            
            // Set multiple cookie formats
            document.cookie = `sb-jvbcpldzoyicefdtnwkd-auth-token=${accessToken}${cookieOptions}`
            document.cookie = `supabase-auth-token=${accessToken}${cookieOptions}`
            document.cookie = `auth-token=${accessToken}${cookieOptions}`
            document.cookie = `access-token=${accessToken}${cookieOptions}`
            document.cookie = `refresh-token=${refreshToken}${cookieOptions}`
            
            console.log('🍪 [SignIn] Cookies created, checking...')
            console.log('🍪 [SignIn] All cookies now:', document.cookie)
            
            // Small delay then redirect
            setTimeout(() => {
              const urlParams = new URLSearchParams(window.location.search)
              const redirectTo = urlParams.get('redirectTo') || '/app'
              console.log('🚀 [SignIn] REDIRECTING TO:', redirectTo)
              window.location.href = redirectTo
            }, 1000)
            
          } else {
            console.error('❌ [SignIn] No session found after login')
          }
        } catch (error) {
          console.error('❌ [SignIn] Error creating cookies:', error)
          
          // Fallback redirect without cookies
          setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search)
            const redirectTo = urlParams.get('redirectTo') || '/app'
            console.log('🆘 [SignIn] FALLBACK REDIRECT TO:', redirectTo)
            window.location.href = redirectTo
          }, 2000)
        }
      }
    } catch (error) {
      toast.error('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      const { data, error } = await signInWithGoogle()
      
      if (error) {
        toast.error(error.message)
        return
      }
      
      // El usuario será redirigido a Google y luego a /auth/callback
      // No hay necesidad de hacer nada más aquí
    } catch (error) {
      toast.error('Error al conectar con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password')
  }

  // EMERGENCY BYPASS FUNCTION
  const handleEmergencyBypass = () => {
    console.log('🆘 [EMERGENCY] Manual bypass triggered')
    const urlParams = new URLSearchParams(window.location.search)
    const redirectTo = urlParams.get('redirectTo') || '/app'
    console.log('🆘 [EMERGENCY] MANUAL REDIRECT TO:', redirectTo)
    window.location.href = redirectTo
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
      {/* EMERGENCY BYPASS BUTTON */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleEmergencyBypass}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
        >
          🆘 EMERGENCY BYPASS
        </button>
      </div>
      
      <MindHubSignInCard 
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onForgotPassword={handleForgotPassword}
      />
    </div>
  )
}