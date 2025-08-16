// ULTRA SIMPLE - exactly like debug-simple but in expedix path

export async function GET() {
  return new Response(JSON.stringify({
    status: "working",
    timestamp: new Date().toISOString(),
    message: "Ultra simple expedix endpoint",
    path: "expedix/ultra-simple"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}