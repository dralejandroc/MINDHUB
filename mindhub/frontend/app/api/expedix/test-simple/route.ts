// Test simple expedix endpoint
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify({
    success: true,
    message: 'Simple expedix test endpoint working',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}