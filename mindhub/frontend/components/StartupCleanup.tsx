'use client'

import { useEffect } from 'react'
import { performStartupCleanup } from '@/lib/supabase/cleanup'

/**
 * Component that runs security cleanup on app startup
 * Automatically removes legacy Clerk cookies and corrupted sessions
 */
export default function StartupCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
          // Forzar recarga de control si había uno activo
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({type: 'SKIP_WAITING'});
          }
        }
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(n => caches.delete(n)));
        }
        console.log('[DEV] SW & caches cleared');
      } catch (e) {
        console.warn('[DEV] Cleanup error', e);
      }
    })();
    // Run cleanup once on component mount
    performStartupCleanup()
  }, [])

  // This component doesn't render anything visible
  return null
}