import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// API Route para servir los escritos psicoeducativos del backend Django
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    const escritosPath = path.join(process.cwd(), '..', 'backend-django', 'resources', 'escritos');

    if (documentId) {
      // Servir un documento específico
      const documentFiles = [
        `${documentId}.json`,
        `${documentId}.json.txt`
      ];

      for (const fileName of documentFiles) {
        try {
          const filePath = path.join(escritosPath, fileName);
          const content = await readFile(filePath, 'utf8');
          const document = JSON.parse(content);
          
          return NextResponse.json({
            success: true,
            document: document
          });
        } catch (error) {
          // Continue to next file if this one doesn't exist
          continue;
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Document not found'
      }, { status: 404 });
    } else {
      // Listar todos los documentos disponibles
      const files = await readdir(escritosPath);
      const jsonFiles = files.filter(file => file.endsWith('.json') || file.endsWith('.json.txt'));
      
      const documents = [];
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(escritosPath, file);
          const content = await readFile(filePath, 'utf8');
          const document = JSON.parse(content);
          
          // Extraer metadatos para el listado
          const metadata = {
            id: document.document?.id || file.replace(/\.(json|txt)$/g, ''),
            title: document.document?.title || 'Sin título',
            category: document.document?.category || 'general',
            subcategory: document.document?.subcategory || '',
            evidence_level: document.document?.evidence_level || 'low',
            target_audience: document.document?.target_audience || 'patients',
            clinical_conditions: document.document?.clinical_conditions || [],
            estimated_reading_time: document.document?.estimated_reading_time || document.document?.reading_time || 5,
            language: document.document?.language || 'es',
            tags: document.document?.tags || [],
            created_date: document.document?.creation_date || document.document?.created_date || new Date().toISOString().split('T')[0],
            author: document.document?.author || { name: 'MindHub Resources', credentials: 'Equipo Clínico' },
            file_name: file
          };
          
          documents.push({
            ...document,
            metadata
          });
        } catch (error) {
          console.error(`Error loading document ${file}:`, error);
        }
      }
      
      return NextResponse.json({
        success: true,
        documents: documents,
        count: documents.length
      });
    }
  } catch (error) {
    console.error('Error loading escritos:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}