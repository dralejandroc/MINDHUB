/**
 * Script para convertir API routes de Railway proxy a Supabase directo
 * Ejecutar con: node scripts/convert-api-routes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando conversión de API routes...\n');

// Función para crear un endpoint básico de Supabase
function createSupabaseEndpoint(tableName, description) {
  return `// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

import { 
  createSupabaseServer, 
  getAuthenticatedUser, 
  createAuthResponse, 
  createErrorResponse, 
  createSuccessResponse 
} from '@/lib/supabase/server'

/**
 * ${description} API Route
 * Now uses Supabase directly instead of Railway backend
 */

export async function GET(request: Request) {
  try {
    console.log('[${tableName} API] Processing GET request with Supabase');
    const { searchParams } = new URL(request.url);
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('${tableName}')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add search filter if applicable
    if (search) {
      // Customize search fields based on table
      query = query.or(\`name.ilike.%\${search}%\`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[${tableName} API] Supabase error:', error);
      throw new Error(error.message);
    }

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    console.log(\`[${tableName} API] Successfully retrieved \${data?.length || 0} records\`);
    
    return createSuccessResponse({
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        pages
      }
    }, '${description} retrieved successfully');

  } catch (error) {
    console.error('[${tableName} API] Error:', error);
    return createErrorResponse('Failed to fetch ${tableName}', error as Error);
  }
}

export async function POST(request: Request) {
  try {
    console.log('[${tableName} API] Processing POST request with Supabase');
    const body = await request.json();
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // Prepare data
    const data = {
      ...body,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert record
    const { data: record, error } = await supabase
      .from('${tableName}')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('[${tableName} API] Supabase error:', error);
      throw new Error(error.message);
    }

    console.log('[${tableName} API] Successfully created record:', record.id);

    return createSuccessResponse(record, '${description} created successfully', 201);

  } catch (error) {
    console.error('[${tableName} API] Error creating record:', error);
    return createErrorResponse('Failed to create ${tableName}', error as Error);
  }
}
`;
}

// Endpoints a convertir
const endpointsToConvert = [
  {
    path: '/Users/alekscon/MINDHUB-Pro/mindhub/frontend/app/api/expedix/consultations/route.ts',
    tableName: 'consultations',
    description: 'Consultations Management'
  },
  {
    path: '/Users/alekscon/MINDHUB-Pro/mindhub/frontend/app/api/clinimetrix-pro/assessments/route.ts',
    tableName: 'clinimetrix_assessments',
    description: 'ClinimetrixPro Assessments'
  },
  {
    path: '/Users/alekscon/MINDHUB-Pro/mindhub/frontend/app/api/resources/route.ts',
    tableName: 'resources',
    description: 'Resources Management'
  }
];

// Función para convertir un endpoint
function convertEndpoint(endpointInfo) {
  const { path: filePath, tableName, description } = endpointInfo;
  
  console.log(`🔄 Convirtiendo: ${filePath}`);
  
  try {
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return false;
    }
    
    // Leer contenido actual
    const currentContent = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya está convertido
    if (currentContent.includes('createSupabaseServer')) {
      console.log(`✅ Ya convertido: ${filePath}`);
      return true;
    }
    
    // Crear el nuevo contenido
    const newContent = createSupabaseEndpoint(tableName, description);
    
    // Escribir el archivo
    fs.writeFileSync(filePath, newContent);
    
    console.log(`✅ Convertido exitosamente: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error convirtiendo ${filePath}:`, error.message);
    return false;
  }
}

// Función para crear endpoint de health check
function createHealthCheckEndpoint() {
  const healthContent = `// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    
    // Test database connection
    const { data, error } = await supabase
      .from('clinic_configurations')
      .select('id')
      .limit(1);
    
    if (error) {
      throw new Error(\`Database error: \${error.message}\`);
    }
    
    return new Response(JSON.stringify({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      migration: 'supabase'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
`;

  const healthPath = '/Users/alekscon/MINDHUB-Pro/mindhub/frontend/app/api/health/route.ts';
  fs.writeFileSync(healthPath, healthContent);
  console.log('✅ Health check endpoint actualizado');
}

// Ejecutar conversiones
async function main() {
  console.log('📋 Endpoints a convertir:', endpointsToConvert.length);
  
  let converted = 0;
  let skipped = 0;
  
  for (const endpoint of endpointsToConvert) {
    if (convertEndpoint(endpoint)) {
      converted++;
    } else {
      skipped++;
    }
  }
  
  // Crear health check
  createHealthCheckEndpoint();
  
  console.log('\\n🎉 Conversión completada!');
  console.log(`✅ Convertidos: ${converted}`);
  console.log(`⚠️  Omitidos: ${skipped}`);
  console.log('🔧 Health check actualizado');
  
  console.log('\\n📝 Siguiente paso: Actualizar llamadas del frontend');
  console.log('🚀 La migración de APIs está casi completa');
}

main().catch(console.error);