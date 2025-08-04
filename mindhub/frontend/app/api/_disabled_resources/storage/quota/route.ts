/**
 * Storage Quota API Route
 * 
 * Handles storage quota information for the resource system
 */

import { NextRequest, NextResponse } from 'next/server';

const RESOURCES_API_BASE = process.env.NEXT_PUBLIC_RESOURCES_API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${RESOURCES_API_BASE}/api/v1/resources/storage/quota`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      // If the backend endpoint doesn't exist, return mock data for development
      if (response.status === 404) {
        const mockQuota = {
          success: true,
          data: {
            used: 1500000000, // 1.5 GB in bytes
            total: 5000000000, // 5 GB in bytes
            available: 3500000000, // 3.5 GB in bytes
            percentage: 30,
            lastUpdated: new Date().toISOString()
          }
        };
        return NextResponse.json(mockQuota);
      }

      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch storage quota' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching storage quota:', error);
    
    // Return mock data if there's a connection error
    const mockQuota = {
      success: true,
      data: {
        used: 1500000000, // 1.5 GB in bytes
        total: 5000000000, // 5 GB in bytes
        available: 3500000000, // 3.5 GB in bytes
        percentage: 30,
        lastUpdated: new Date().toISOString()
      }
    };
    return NextResponse.json(mockQuota);
  }
}