// Test if top-level API works vs nested paths

export async function GET() {
  return new Response(JSON.stringify({
    status: "working",
    timestamp: new Date().toISOString(),
    message: "Top-level test endpoint works",
    path: "test-working"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}