// Simple debug endpoint - no dependencies  
// Use nodejs runtime for better Vercel compatibility
export const runtime = 'nodejs';

export async function GET() {
  try {
    return new Response(JSON.stringify({
      status: "working",
      timestamp: new Date().toISOString(),
      message: "Simple debug endpoint works"
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