// Simple direct Supabase patients API - Fallback for reliability
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log('[PATIENTS-SIMPLE] Direct Supabase query')
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Extract user ID from request headers or query params
    const url = new URL(request.url)
    const userIdParam = url.searchParams.get('user_id')
    
    // Default to known user ID if not provided (for debugging)
    const targetUserId = userIdParam || 'a1c193e9-643a-4ba9-9214-29536ea93913'
    
    console.log('[PATIENTS-SIMPLE] Querying for user ID:', targetUserId)
    
    // Query patients directly from Supabase
    const { data: patients, error } = await supabase
      .from('patients')
      .select(`
        *,
        consultations:consultations(count),
        appointments:appointments(count)
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
    
    console.log('[PATIENTS-SIMPLE] Supabase query result:', {
      error: error?.message,
      count: patients?.length || 0,
      sample: patients?.[0] ? Object.keys(patients[0]) : 'no patients'
    })
    
    if (error) {
      console.error('[PATIENTS-SIMPLE] Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        count: 0,
        results: []
      }, { status: 500 })
    }
    
    // Transform data to expected format
    const transformedPatients = patients?.map(patient => ({
      id: patient.id,
      first_name: patient.first_name,
      paternal_last_name: patient.paternal_last_name,
      maternal_last_name: patient.maternal_last_name,
      birth_date: patient.birth_date,
      gender: patient.gender,
      email: patient.email,
      cell_phone: patient.cell_phone,
      phone: patient.phone,
      curp: patient.curp,
      address: patient.address,
      city: patient.city,
      state: patient.state,
      postal_code: patient.postal_code,
      consultations_count: patient.consultations?.[0]?.count || 0,
      created_at: patient.created_at,
      updated_at: patient.updated_at
    })) || []
    
    console.log('[PATIENTS-SIMPLE] Returning patients:', transformedPatients.length)
    
    return NextResponse.json({
      success: true,
      count: transformedPatients.length,
      results: transformedPatients,
      debug: {
        user_id: targetUserId,
        query_time: new Date().toISOString(),
        source: 'direct_supabase'
      }
    })
    
  } catch (error) {
    console.error('[PATIENTS-SIMPLE] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
      results: []
    }, { status: 500 })
  }
}