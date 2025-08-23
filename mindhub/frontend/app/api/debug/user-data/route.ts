// Debug API to check user data directly
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log('[DEBUG USER-DATA] Starting debug query')
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const url = new URL(request.url)
    const email = url.searchParams.get('email') || 'dr_aleks_c@hotmail.com'
    const userId = url.searchParams.get('user_id') || 'a1c193e9-643a-4ba9-9214-29536ea93913'
    
    console.log('[DEBUG USER-DATA] Checking for:', { email, userId })
    
    // Check if user exists in auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    const targetAuthUser = authUsers?.users?.find(u => u.email === email || u.id === userId)
    
    // Check patients table
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
    
    // Check consultations table  
    const { data: consultations, error: consultationsError } = await supabase
      .from('consultations')
      .select('*')
      .eq('user_id', userId)
    
    // Check appointments table
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments') 
      .select('*')
      .eq('user_id', userId)
    
    const result = {
      timestamp: new Date().toISOString(),
      query: { email, userId },
      auth_user: {
        found: !!targetAuthUser,
        id: targetAuthUser?.id,
        email: targetAuthUser?.email,
        created_at: targetAuthUser?.created_at,
        error: authError?.message
      },
      patients: {
        count: patients?.length || 0,
        data: patients?.map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.paternal_last_name}`,
          created_at: p.created_at
        })) || [],
        error: patientsError?.message
      },
      consultations: {
        count: consultations?.length || 0,
        error: consultationsError?.message
      },
      appointments: {
        count: appointments?.length || 0,
        error: appointmentsError?.message
      },
      database_info: {
        url: supabaseUrl,
        service_key_prefix: supabaseServiceKey?.substring(0, 20) + '...'
      }
    }
    
    console.log('[DEBUG USER-DATA] Results:', {
      auth_found: result.auth_user.found,
      patients_count: result.patients.count,
      consultations_count: result.consultations.count,
      appointments_count: result.appointments.count
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[DEBUG USER-DATA] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}