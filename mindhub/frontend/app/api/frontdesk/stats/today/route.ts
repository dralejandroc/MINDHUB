import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/frontdesk/stats/today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying frontdesk stats today request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch today stats from backend',
        data: {
          appointments: {
            total: 8,
            confirmed: 6,
            pending: 1,
            cancelled: 1
          },
          tasks: {
            total: 12,
            completed: 8,
            pending: 4
          },
          patients: {
            total: 15,
            new: 3,
            returning: 12
          }
        }
      }, 
      { status: 500 }
    );
  }
}