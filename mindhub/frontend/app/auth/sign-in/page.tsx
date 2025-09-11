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
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success('¡Bienvenido a MindHub!')
        console.log('✅ [SignIn] Login successful - starting immediate redirect polling')
        
        // AGGRESSIVE POLLING: Don't rely on AuthProvider events
        const forceRedirect = async (attempt = 1, maxAttempts = 15) => {
          const currentPath = window.location.pathname
          if (!currentPath.startsWith('/auth/')) {
            console.log('✅ [SignIn] Already redirected, polling cancelled')
            return
          }
          
          console.log(`🔄 [SignIn] Polling redirect attempt ${attempt}/${maxAttempts}`)
          
          try {
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session && session.user) {
              console.log('🎯 [SignIn] Session confirmed, forcing redirect NOW')
              const urlParams = new URLSearchParams(window.location.search)
              const redirectTo = urlParams.get('redirectTo') || '/app'
              
              // Use multiple redirect methods simultaneously
              console.log('🚀 [SignIn] FORCING NAVIGATION TO:', redirectTo)
              
              // Method 1: window.location.href (primary)
              window.location.href = redirectTo
              
              // Method 2: window.location.assign (backup)
              setTimeout(() => {
                if (window.location.pathname.startsWith('/auth/')) {
                  console.log('🔧 [SignIn] Using window.location.assign backup')
                  window.location.assign(redirectTo)
                }
              }, 100)
              
              // Method 3: window.location.replace (last resort)
              setTimeout(() => {
                if (window.location.pathname.startsWith('/auth/')) {
                  console.log('🆘 [SignIn] Using window.location.replace last resort')
                  window.location.replace(redirectTo)
                }
              }, 500)
              
              return
            } else if (attempt < maxAttempts) {
              console.log('⏳ [SignIn] Session not ready, continuing polling...')
              setTimeout(() => forceRedirect(attempt + 1, maxAttempts), 300)
            } else {
              console.error('❌ [SignIn] CRITICAL: No session after all attempts!')
              // Force redirect anyway as absolute last resort
              const urlParams = new URLSearchParams(window.location.search)
              const redirectTo = urlParams.get('redirectTo') || '/app'
              console.log('🆘 [SignIn] LAST RESORT REDIRECT TO:', redirectTo)
              window.location.replace(redirectTo)
            }
          } catch (error) {
            console.error('❌ [SignIn] Polling error:', error)
            if (attempt < maxAttempts) {
              setTimeout(() => forceRedirect(attempt + 1, maxAttempts), 300)
            } else {
              // Emergency redirect
              const urlParams = new URLSearchParams(window.location.search)
              const redirectTo = urlParams.get('redirectTo') || '/app'
              window.location.replace(redirectTo)
            }
          }
        }
        
        // Start immediate aggressive polling
        setTimeout(() => forceRedirect(), 100)
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
      <MindHubSignInCard 
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onForgotPassword={handleForgotPassword}
      />
    </div>
  )
}