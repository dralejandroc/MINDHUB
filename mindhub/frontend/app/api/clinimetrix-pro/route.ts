import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const backendUrl = `${process.env.BACKEND_URL}/api/clinimetrix-pro${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clinimetrix Pro API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Clinimetrix Pro API' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = `${process.env.BACKEND_URL}/api/clinimetrix-pro`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clinimetrix Pro API Error:', error);
    return NextResponse.json(
      { error: 'Failed to post to Clinimetrix Pro API' },
      { status: 500 }
    );
  }
}