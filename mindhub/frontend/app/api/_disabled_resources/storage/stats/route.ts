/**
 * Storage Stats API Route
 * 
 * Handles storage statistics for the resource system
 */

import { NextRequest, NextResponse } from 'next/server';

const RESOURCES_API_BASE = process.env.NEXT_PUBLIC_RESOURCES_API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${RESOURCES_API_BASE}/api/resources/storage/stats`,
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
        const fileTypes = {
          pdf: { count: 45, size: 800000000 },
          doc: { count: 30, size: 400000000 },
          docx: { count: 25, size: 200000000 },
          txt: { count: 15, size: 50000000 },
          other: { count: 10, size: 50000000 }
        };

        // Transform fileTypes object to breakdown array
        const breakdown = Object.entries(fileTypes).map(([type, data]) => ({
          type,
          count: data.count,
          totalSize: data.size,
          formattedSize: formatBytes(data.size)
        }));

        const mockStats = {
          success: true,
          data: {
            quota: {
              used: 1500000000,
              total: 5000000000,
              available: 3500000000,
              percentage: 30
            },
            breakdown,
            recentUploads: [
              {
                id: 1,
                title: 'Manual de Usuario.pdf',
                uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                size: 2048000
              },
              {
                id: 2,
                title: 'Guía Terapéutica.docx',
                uploadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                size: 1536000
              }
            ],
            recommendations: [
              {
                type: 'tip',
                message: 'Considera comprimir archivos PDF grandes para ahorrar espacio',
                action: 'Puedes usar herramientas online para reducir el tamaño de PDFs'
              },
              {
                type: 'info', 
                message: 'Revisa archivos antiguos que podrían no ser necesarios',
                action: 'Elimina documentos obsoletos para liberar espacio'
              }
            ],
            trends: {
              weeklyGrowth: 5.2,
              monthlyGrowth: 18.7
            }
          }
        };

        // Helper function to format bytes
        function formatBytes(bytes: number) {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        return NextResponse.json(mockStats);
      }

      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch storage stats' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    
    // Return mock data if there's a connection error
    const fileTypes = {
      pdf: { count: 45, size: 800000000 },
      doc: { count: 30, size: 400000000 },
      docx: { count: 25, size: 200000000 },
      txt: { count: 15, size: 50000000 },
      other: { count: 10, size: 50000000 }
    };

    // Transform fileTypes object to breakdown array
    const breakdown = Object.entries(fileTypes).map(([type, data]) => ({
      type,
      count: data.count,
      totalSize: data.size,
      formattedSize: formatBytes(data.size)
    }));

    const mockStats = {
      success: true,
      data: {
        quota: {
          used: 1500000000,
          total: 5000000000,
          available: 3500000000,
          percentage: 30
        },
        breakdown,
        recentUploads: [
          {
            id: 1,
            title: 'Manual de Usuario.pdf',
            uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            size: 2048000
          },
          {
            id: 2,
            title: 'Guía Terapéutica.docx',
            uploadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            size: 1536000
          }
        ],
        recommendations: [
          {
            type: 'tip',
            message: 'Considera comprimir archivos PDF grandes para ahorrar espacio',
            action: 'Puedes usar herramientas online para reducir el tamaño de PDFs'
          },
          {
            type: 'info',
            message: 'Revisa archivos antiguos que podrían no ser necesarios',
            action: 'Elimina documentos obsoletos para liberar espacio'
          }
        ],
        trends: {
          weeklyGrowth: 5.2,
          monthlyGrowth: 18.7
        }
      }
    };

    // Helper function to format bytes
    function formatBytes(bytes: number) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    return NextResponse.json(mockStats);
  }
}