// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    
    // Test database connection
    const { data, error } = await supabase
      .from('clinic_configurations')
      .select('id')
      .limit(1);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return new Response(JSON.stringify({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      migration: 'supabase'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
