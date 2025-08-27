// Debug endpoint to check database tables
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[DEBUG TABLES] Checking available tables...');

    // Check for appointments table
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .limit(1);

    console.log('Appointments table check:', { appointments, appointmentsError });

    // Check for patients table
    const { data: patients, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .limit(1);

    console.log('Patients table check:', { patients, patientsError });

    // Try to get table information from information_schema
    let tables = null;
    let tablesError = null;
    
    try {
      const result = await supabaseAdmin.rpc('list_tables');
      tables = result.data;
      tablesError = result.error;
    } catch (rpcError) {
      // If RPC doesn't exist, try direct query
      const result = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      tables = result.data;
      tablesError = result.error;
    }

    return new Response(JSON.stringify({
      appointments: { data: appointments, error: appointmentsError },
      patients: { data: patients, error: patientsError },
      tables: { data: tables, error: tablesError },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[DEBUG TABLES] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}