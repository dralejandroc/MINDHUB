import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const backendUrl = `${process.env.BACKEND_URL}/api/clinimetrix-pro/templates${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clinimetrix Pro Templates API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates from Clinimetrix Pro API' },
      { status: 500 }
    );
  }
}