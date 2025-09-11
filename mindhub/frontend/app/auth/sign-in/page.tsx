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
        console.log('✅ [SignIn] Login successful - AuthProvider will handle redirect')
        
        // Let the AuthProvider handle the redirect via onAuthStateChange
        // This prevents conflicts between multiple redirect attempts
        
        // Backup redirect with session verification for new browsers
        const backupRedirect = async (attempt = 1, maxAttempts = 10) => {
          const currentPath = window.location.pathname
          if (!currentPath.startsWith('/auth/')) {
            console.log('✅ [SignIn] Already redirected, backup cancelled')
            return
          }
          
          console.log(`🔧 [SignIn] Backup redirect attempt ${attempt}/${maxAttempts}`)
          
          try {
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session && session.user) {
              console.log('🚀 [SignIn] Backup redirect - session confirmed')
              const urlParams = new URLSearchParams(window.location.search)
              const redirectTo = urlParams.get('redirectTo') || '/app'
              window.location.href = redirectTo
            } else if (attempt < maxAttempts) {
              console.log('⏳ [SignIn] Backup redirect - session not ready, waiting...')
              setTimeout(() => backupRedirect(attempt + 1, maxAttempts), 500)
            } else {
              console.error('❌ [SignIn] Backup redirect failed - no session after all attempts')
            }
          } catch (error) {
            console.error('❌ [SignIn] Backup redirect error:', error)
            if (attempt < maxAttempts) {
              setTimeout(() => backupRedirect(attempt + 1, maxAttempts), 500)
            }
          }
        }
        
        // Start backup redirect after initial delay
        setTimeout(() => backupRedirect(), 3000)
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