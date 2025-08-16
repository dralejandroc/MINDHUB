// Version endpoint to verify deployment
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify({
    version: "1.0.1-api-fix",
    timestamp: new Date().toISOString(),
    backend_url: process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app',
    node_env: process.env.NODE_ENV || 'unknown',
    deployment_id: process.env.VERCEL_DEPLOYMENT_ID || 'local'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}