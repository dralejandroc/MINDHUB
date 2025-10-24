'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signIn, signInWithGoogle } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { MindHubSignInCard } from '@/components/auth/MindHubSignInCard'
import { useState } from 'react'
import { test } from '@playwright/test';
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

    // test();
  }, [])

  // const test = () => {
  //   const url = 'https://jvbcpldzoyicefdtnwkd.supabase.co/auth/v1/token?grant_type=password'
  //   const key = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDE0NzAsImV4cCI6MjA3MDk3NzQ3MH0.st42ODkomKcaTcT88Xqc3LT_Zo9oVWhkCVwCP07n4NY'
  //   fetch(url, {
  //     method: 'POST',
  //     headers: {
  //       'content-type': 'application/json',
  //       apikey: key,
  //       authorization: `Bearer ${key}`,
  //     },
  //     body: JSON.stringify({ email: 'dr_aleks_c@hotmail.com', password: '53AlfaCoca.' }),
  //   }).then(r => r.status).then(console.log)
  // };
  // TEMPORARILY DISABLED: Auto-redirect causing infinite loop
  // Handle automatic redirect when user is already authenticated
  // useEffect(() => {
  //   if (session && user && !loading) {
  //     console.log('✅ [LOGIN] User already authenticated, redirecting with window.location')
  //     const urlParams = new URLSearchParams(window.location.search)
  //     const redirectTo = urlParams.get('redirectTo') || '/dashboard'
  //     console.log('🚀 [LOGIN] REDIRECTING TO:', redirectTo)
  //     
  //     // Use window.location.href for reliable navigation after auth
  //     window.location.href = redirectTo
  //   }
  // }, [session, user, loading])

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
        
        router.replace('/dashboard')
        // Redirect after successful login
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirectTo') || '/dashboard'
        
        console.log('🚀 [LOGIN] REDIRECTING TO:', redirectTo)
        
        // Use window.location.href for reliable navigation
        setTimeout(() => {
          window.location.href = redirectTo
        }, 1000) // Wait for toast
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