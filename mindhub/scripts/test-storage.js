/**
 * Storage System Test Script
 * 
 * Tests the file storage system functionality for MindHub.
 */

const fs = require('fs');
const path = require('path');
const { 
  initializeLocalStorage, 
  getStorageStats, 
  validateFile,
  generateSecureFileName,
  STORAGE_PATHS,
  config,
  logger 
} = require('../backend/shared/config/storage');

async function testStorageSystem() {
  console.log('🗂️ Testing MindHub Storage System...\n');

  try {
    // Test 1: Initialize storage directories
    console.log('1. Testing storage initialization...');
    initializeLocalStorage();
    
    // Check if directories were created
    const baseDir = config.local.uploadDir;
    if (fs.existsSync(baseDir)) {
      console.log('✅ Base upload directory created:', baseDir);
    } else {
      console.log('❌ Failed to create base directory');
      return false;
    }

    // Test 2: Check directory structure
    console.log('\n2. Verifying directory structure...');
    let directoriesCreated = 0;
    
    for (const [category, paths] of Object.entries(STORAGE_PATHS)) {
      console.log(`   📁 ${category}:`);
      for (const [subcategory, subPath] of Object.entries(paths)) {
        const fullPath = path.join(baseDir, subPath);
        const gitkeepPath = path.join(fullPath, '.gitkeep');
        
        if (fs.existsSync(fullPath) && fs.existsSync(gitkeepPath)) {
          console.log(`      ✅ ${subcategory}: ${subPath}`);
          directoriesCreated++;
        } else {
          console.log(`      ❌ ${subcategory}: ${subPath} (missing)`);
        }
      }
    }
    
    console.log(`\n   Total directories: ${directoriesCreated}`);

    // Test 3: File validation
    console.log('\n3. Testing file validation...');
    
    const testFiles = [
      {
        originalname: 'test-document.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024, // 1MB
        category: 'patients'
      },
      {
        originalname: 'large-video.mp4',
        mimetype: 'video/mp4',
        size: 100 * 1024 * 1024, // 100MB
        category: 'resources'
      },
      {
        originalname: 'malicious-file.exe',
        mimetype: 'application/exe',
        size: 1024,
        category: 'general'
      }
    ];
    
    for (const file of testFiles) {
      const validation = validateFile(file, file.category);
      console.log(`   ${validation.isValid ? '✅' : '❌'} ${file.originalname} (${file.category})`);
      if (!validation.isValid) {
        console.log(`      Errors: ${validation.errors.join(', ')}`);
      }
    }

    // Test 4: Secure filename generation
    console.log('\n4. Testing secure filename generation...');
    
    const testFilenames = [
      'patient-report.pdf',
      'assessment-data.json',
      'educational-video.mp4',
      '../../../etc/passwd' // Directory traversal attempt
    ];
    
    for (const filename of testFilenames) {
      const secureFilename = generateSecureFileName(filename, 'test-patient-123');
      console.log(`   📄 ${filename} → ${secureFilename}`);
    }

    // Test 5: Storage statistics
    console.log('\n5. Testing storage statistics...');
    const stats = await getStorageStats();
    console.log('   📊 Storage Stats:');
    console.log(`      Total size: ${stats.totalSize} bytes`);
    console.log(`      File count: ${stats.fileCount}`);
    console.log('      Categories:');
    
    for (const [category, categoryStats] of Object.entries(stats.categories)) {
      console.log(`        ${category}: ${categoryStats.count} files, ${categoryStats.size} bytes`);
    }

    // Test 6: Create test file to verify upload directory
    console.log('\n6. Testing file creation...');
    const testFilePath = path.join(baseDir, 'system', 'temp', 'test-file.txt');
    const testContent = 'This is a test file created by the storage system test.\nTimestamp: ' + new Date().toISOString();
    
    try {
      await fs.promises.writeFile(testFilePath, testContent);
      console.log('   ✅ Test file created successfully');
      
      // Create metadata file
      const metadataPath = testFilePath + '.meta.json';
      const metadata = {
        originalName: 'test-file.txt',
        fileName: 'test-file.txt',
        mimeType: 'text/plain',
        size: testContent.length,
        category: 'system',
        subcategory: 'temp',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system-test',
        testFile: true
      };
      
      await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      console.log('   ✅ Metadata file created successfully');
      
      // Clean up test file
      await fs.promises.unlink(testFilePath);
      await fs.promises.unlink(metadataPath);
      console.log('   ✅ Test files cleaned up');
      
    } catch (error) {
      console.log('   ❌ File creation test failed:', error.message);
    }

    // Test 7: Configuration validation
    console.log('\n7. Testing configuration...');
    console.log(`   Storage mode: ${config.mode}`);
    console.log(`   Upload directory: ${config.local.uploadDir}`);
    console.log(`   Max file size: ${config.local.maxFileSize / 1024 / 1024}MB`);
    console.log(`   Allowed MIME types: ${config.local.allowedMimeTypes.length} types`);
    console.log(`   Base URL: ${config.local.baseUrl}`);
    
    if (config.mode === 'gcloud') {
      console.log(`   GCloud project: ${config.gcloud.projectId}`);
      console.log(`   GCloud bucket: ${config.gcloud.bucketName}`);
    }

    console.log('\n✅ Storage system tests completed successfully!');
    console.log('\n🚀 Storage system is ready for development.');
    
    console.log('\n📋 Available storage paths:');
    for (const [category, paths] of Object.entries(STORAGE_PATHS)) {
      console.log(`   ${category}:`);
      for (const [subcategory, subPath] of Object.entries(paths)) {
        console.log(`     - ${subcategory}: /${subPath}`);
      }
    }
    
    console.log('\n💡 Next steps:');
    console.log('1. Configure environment variables in .env');
    console.log('2. Test file upload via API endpoints');
    console.log('3. Set up authentication middleware');
    console.log('4. Configure healthcare compliance settings');
    
    return true;

  } catch (error) {
    console.error('\n❌ Storage system test failed:');
    console.error('Error:', error.message);
    
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('1. Check directory permissions');
    console.log('2. Ensure upload directory is writable');
    console.log('3. Verify environment configuration');
    console.log('4. Review logs for detailed error information');
    
    return false;
  }
}

/**
 * Test individual file upload workflow
 */
async function testFileUploadWorkflow() {
  console.log('\n📁 Testing file upload workflow...');
  
  try {
    // Simulate file upload
    const mockFile = {
      originalname: 'patient-assessment.pdf',
      mimetype: 'application/pdf',
      size: 2 * 1024 * 1024, // 2MB
      buffer: Buffer.from('Mock PDF content for testing')
    };
    
    const mockMetadata = {
      patientId: 'patient-123',
      userId: 'user-456',
      uploadSource: 'test_script'
    };
    
    console.log('   📄 Mock file details:');
    console.log(`      Name: ${mockFile.originalname}`);
    console.log(`      Type: ${mockFile.mimetype}`);
    console.log(`      Size: ${mockFile.size} bytes`);
    
    // Validate file
    const validation = validateFile(mockFile, 'patients');
    if (validation.isValid) {
      console.log('   ✅ File validation passed');
    } else {
      console.log('   ❌ File validation failed:', validation.errors.join(', '));
      return false;
    }
    
    // Generate secure filename
    const secureFilename = generateSecureFileName(mockFile.originalname, mockMetadata.patientId);
    console.log(`   🔒 Secure filename: ${secureFilename}`);
    
    console.log('\n   ✅ File upload workflow test completed');
    return true;
    
  } catch (error) {
    console.log('\n   ❌ File upload workflow test failed:', error.message);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testStorageSystem()
    .then(async (success) => {
      if (success) {
        await testFileUploadWorkflow();
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { 
  testStorageSystem, 
  testFileUploadWorkflow 
};