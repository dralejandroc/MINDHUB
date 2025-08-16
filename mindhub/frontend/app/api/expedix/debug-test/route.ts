// Test endpoint at expedix depth to isolate the issue

export async function GET() {
  return new Response(JSON.stringify({
    status: "working",
    timestamp: new Date().toISOString(),
    message: "Expedix debug test endpoint works",
    depth: "expedix/debug-test"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}