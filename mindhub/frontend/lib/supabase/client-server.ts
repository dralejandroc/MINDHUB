// frontend/lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbcpldzoyicefdtnwkd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTM2MTcwOTEsImV4cCI6MjAwOTE5MzA5MX0.st42ODkomKcaTcT88Xqc3LT_Zo9oVWhkCVwCP07n4NY'

// Cliente para usar SOLO en server (API routes, server components, etc.)
export const createServerClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
