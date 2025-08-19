'use client'

import { useEffect } from 'react'
import { performStartupCleanup } from '@/lib/supabase/cleanup'

/**
 * Component that runs security cleanup on app startup
 * Automatically removes legacy Clerk cookies and corrupted sessions
 */
export default function StartupCleanup() {
  useEffect(() => {
    // Run cleanup once on component mount
    performStartupCleanup()
  }, [])

  // This component doesn't render anything visible
  return null
}