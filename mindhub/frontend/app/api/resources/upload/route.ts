// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

import { 
  createSupabaseServer, 
  getAuthenticatedUser, 
  createAuthResponse, 
  createErrorResponse, 
  createSuccessResponse 
} from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid';

/**
 * Resources Upload API Route
 * Handles file uploads to Supabase Storage
 */

// Configure max file size (100MB)
export const maxDuration = 60; // 60 seconds timeout for large file uploads

export async function POST(request: Request) {
  try {
    console.log('[resources/upload API] Processing upload request');
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const categoryId = formData.get('categoryId') as string;
    const libraryType = formData.get('libraryType') as string || 'private';
    const tagsString = formData.get('tags') as string;
    
    if (!file) {
      return createErrorResponse('No file provided', new Error('File is required'));
    }
    
    // Validate file size (100MB max)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse('File too large', new Error('File size exceeds 100MB limit'));
    }
    
    // Parse tags
    let tags: string[] = [];
    try {
      if (tagsString) {
        tags = JSON.parse(tagsString);
        // Ensure tags is an array
        if (!Array.isArray(tags)) {
          tags = [];
        }
      }
    } catch (e) {
      console.warn('[resources/upload API] Failed to parse tags:', e);
      tags = [];
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Determine storage bucket based on library type
    const bucketName = libraryType === 'public' ? 'public-resources' : 'private-resources';
    
    // Create bucket if it doesn't exist (first time setup)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.log(`[resources/upload API] Creating bucket: ${bucketName}`);
      const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
        public: libraryType === 'public',
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (createBucketError && createBucketError.message !== 'Bucket already exists') {
        console.error('[resources/upload API] Error creating bucket:', createBucketError);
        throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
      }
    }
    
    // Upload file to Supabase Storage
    const filePath = `${user.id}/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('[resources/upload API] Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    
    console.log('[resources/upload API] File uploaded successfully:', uploadData);
    
    // Get public URL if public library
    let fileUrl = '';
    if (libraryType === 'public') {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    } else {
      // For private files, we'll generate signed URLs when needed
      fileUrl = `private://${bucketName}/${filePath}`;
    }
    
    // Save resource metadata to database
    const resourceData = {
      id: uuidv4(),
      title: title || file.name.split('.')[0],
      description: '',
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: fileUrl,
      storage_path: filePath,
      bucket_name: bucketName,
      category_id: categoryId || null,
      library_type: libraryType,
      tags: tags,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert into medical_resources table
    const { data: resource, error: dbError } = await supabase
      .from('medical_resources')
      .insert([resourceData])
      .select()
      .single();
    
    if (dbError) {
      console.error('[resources/upload API] Database error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from(bucketName).remove([filePath]);
      throw new Error(`Failed to save resource metadata: ${dbError.message}`);
    }
    
    console.log('[resources/upload API] Resource saved successfully:', resource.id);
    
    return createSuccessResponse({
      data: resource,
      message: 'File uploaded successfully'
    }, 'Resource uploaded successfully', 201);
    
  } catch (error) {
    console.error('[resources/upload API] Error:', error);
    return createErrorResponse('Failed to upload resource', error as Error);
  }
}

// GET endpoint to check upload status or retrieve signed URLs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    if (!resourceId) {
      return createErrorResponse('Resource ID is required', new Error('Missing resource ID'));
    }
    
    const supabase = createSupabaseServer()
    
    // Get resource from database
    const { data: resource, error } = await supabase
      .from('medical_resources')
      .select('*')
      .eq('id', resourceId)
      .single();
    
    if (error || !resource) {
      return createErrorResponse('Resource not found', new Error('Resource does not exist'));
    }
    
    // If private resource, generate signed URL
    if (resource.library_type === 'private' && resource.storage_path) {
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from(resource.bucket_name)
        .createSignedUrl(resource.storage_path, 3600); // 1 hour expiry
      
      if (!urlError && signedUrlData) {
        resource.signed_url = signedUrlData.signedUrl;
      }
    }
    
    return createSuccessResponse({
      data: resource
    }, 'Resource retrieved successfully');
    
  } catch (error) {
    console.error('[resources/upload API] Error:', error);
    return createErrorResponse('Failed to retrieve resource', error as Error);
  }
}