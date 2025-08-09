/**
 * ClinimetrixPro Templates Catalog API Route
 * Proxies requests to the backend ClinimetrixPro API
 */

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    const response = await fetch(`${backendUrl}/api/clinimetrix-pro/templates/catalog`);
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching templates catalog:', error);
    return Response.json({ error: 'Failed to fetch templates catalog' }, { status: 500 });
  }
}