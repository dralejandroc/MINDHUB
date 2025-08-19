// Debug endpoint to check environment variables in production
export const dynamic = 'force-dynamic';

export async function GET() {
  // Check which environment variables are available
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    
    // Check if Supabase variables are set
    SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY_SET: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Check lengths (not actual values for security)
    SUPABASE_URL_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    SUPABASE_ANON_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    SUPABASE_SERVICE_ROLE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    
    // Check if URL is correct
    SUPABASE_URL_STARTS_WITH: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT_SET',
    
    // Runtime info
    timestamp: new Date().toISOString(),
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: !!process.env.VERCEL,
  };

  return new Response(JSON.stringify(envCheck, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}