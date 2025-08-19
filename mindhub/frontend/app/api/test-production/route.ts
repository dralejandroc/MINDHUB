// API para diagnosticar qué está pasando en producción
export async function GET() {
  try {
    // Log todo para debug
    console.log('=== DIAGNOSTIC API START ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL:', process.env.VERCEL);
    console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
    console.log('Has SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Has SUPABASE_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const diagnosticData = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      message: 'Diagnostic API is working'
    };
    
    console.log('Diagnostic data:', JSON.stringify(diagnosticData, null, 2));
    console.log('=== DIAGNOSTIC API END ===');
    
    return new Response(JSON.stringify(diagnosticData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
  } catch (error) {
    console.error('Diagnostic API Error:', error);
    
    const errorData = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorData), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}