// Debug API to check what's causing the 500 error
export async function GET() {
  try {
    // Check if basic JavaScript works
    const timestamp = new Date().toISOString();
    const nodeEnv = process.env.NODE_ENV || 'undefined';
    
    // Try to check environment variables without using them
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    return new Response(JSON.stringify({
      success: true,
      debug: {
        timestamp,
        nodeEnv,
        hasSupabaseUrl,
        hasSupabaseKey,
        message: 'Environment debug successful'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // If even this fails, we know the problem is deeper
    return new Response(JSON.stringify({
      success: false,
      error: 'Debug API failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}