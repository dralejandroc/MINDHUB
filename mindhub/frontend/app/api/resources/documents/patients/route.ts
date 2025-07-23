/**
 * Patient Documents API Route
 * 
 * Handles patient search for document resource management
 */

import { NextRequest, NextResponse } from 'next/server';

const RESOURCES_API_BASE = process.env.NEXT_PUBLIC_RESOURCES_API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const EXPEDIX_API_BASE = process.env.NEXT_PUBLIC_EXPEDIX_API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '10';
    
    // First try the resources API
    try {
      const response = await fetch(
        `${RESOURCES_API_BASE}/api/v1/resources/documents/patients?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log('Resources API not available, falling back to Expedix API');
    }

    // Fallback to Expedix API for patient search
    try {
      const expedixParams = new URLSearchParams();
      if (search) expedixParams.append('search', search);
      expedixParams.append('limit', limit);

      const response = await fetch(
        `${EXPEDIX_API_BASE}/api/v1/expedix/patients?${expedixParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      if (response.ok) {
        const expedixData = await response.json();
        
        // Transform Expedix data to match resource document format
        const transformedData = {
          success: true,
          data: expedixData.data?.map((patient: any) => ({
            id: patient.id,
            name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            medicalRecordNumber: patient.medicalRecordNumber,
            documentCount: 0, // Default since we don't have document count
            lastDocumentDate: null
          })) || []
        };

        return NextResponse.json(transformedData);
      }
    } catch (expedixError) {
      console.error('Expedix API also failed:', expedixError);
    }

    // Return empty results if both APIs fail
    return NextResponse.json({
      success: true,
      data: []
    });

  } catch (error) {
    console.error('Error searching patients for documents:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}