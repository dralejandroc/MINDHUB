import type { NextRequest } from 'next/server';

// Garantizamos runtime Node (útil para streaming binario)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const pdfUrl = req.nextUrl.searchParams.get('url');

  if (!pdfUrl) {
    return new Response('Missing url param', { status: 400 });
  }

  try {
    // Pedimos el PDF a S3
    const upstream = await fetch(pdfUrl);

    if (!upstream.ok || !upstream.body) {
      return new Response('Error fetching PDF', { status: upstream.status });
    }

    const headers = new Headers(upstream.headers);

    // Forzamos el tipo de contenido y eliminamos cabeceras que bloquean iframe
    headers.set('Content-Type', 'application/pdf');
    headers.delete('x-frame-options');
    headers.delete('content-security-policy');

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error('Error in /api/pdf-proxy:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
