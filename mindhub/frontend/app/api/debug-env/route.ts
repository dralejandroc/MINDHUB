// Debug endpoint to check environment variables
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return new Response(JSON.stringify({
      status: "success",
      env_vars: {
        NODE_ENV: process.env.NODE_ENV,
        BACKEND_URL: process.env.BACKEND_URL,
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL
      },
      computed_backend: process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: "error", 
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}