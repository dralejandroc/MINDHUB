'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signIn, signInWithGoogle } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { MindHubSignInCard } from '@/components/auth/MindHubSignInCard'
import { useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'

// Clean Architecture: Domain entities for authentication
interface SignInData {
  email: string;
  password: string;
}

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, session } = useAuth()

  // Clean Architecture: Set document title (UI layer concern)
  useEffect(() => {
    document.title = 'Iniciar Sesión - MindHub'
  }, [])

  // Handle automatic redirect when user is already authenticated
  useEffect(() => {
    if (session && user && !loading) {
      console.log('✅ [LOGIN] User already authenticated, forcing redirect with window.location')
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirectTo') || '/app'
      console.log('🚀 [LOGIN] FORCING REDIRECT TO:', redirectTo)
      
      // Use window.location.href which actually works unlike router.push
      window.location.href = redirectTo
    }
  }, [session, user, loading, router])

  const handleSignIn = async (email: string, password: string) => {
    console.log('✅ [LOGIN] Iniciando login para:', email)
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        console.log('❌ [LOGIN] Error:', error.message)
        toast.error(error.message)
        return
      }

      if (data.user) {
        console.log('🎉 [LOGIN] ¡Login exitoso!', data.user.id)
        toast.success('¡Bienvenido a MindHub!')
        
        // Direct redirect - don't wait for auth state changes
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirectTo') || '/app'
        
        console.log('🚀 [LOGIN] REDIRECTING IMMEDIATELY TO:', redirectTo)
        
        // Force redirect immediately 
        setTimeout(() => {
          window.location.href = redirectTo
        }, 500) // Small delay for toast to show
      }
    } catch (error) {
      console.log('💥 [LOGIN] Error inesperado:', error)
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
        loading={loading}
      />
    </div>
  )
}