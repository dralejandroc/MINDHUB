/**
 * ClinimetrixPro Template by ID API Route
 * Proxies requests to get specific template data
 */

export async function GET(request: Request, { params }: { params: { templateId: string } }) {
  try {
    const { templateId } = params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    const response = await fetch(`${backendUrl}/api/clinimetrix-pro/templates/${templateId}`);
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching template:', error);
    return Response.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}