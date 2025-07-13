#!/usr/bin/env node

/**
 * Documentation Generation Script for MindHub Healthcare Platform
 * 
 * Automated script to generate complete API documentation including
 * OpenAPI specs, interactive docs, and healthcare compliance guides
 */

const path = require('path');
const OpenAPIGenerator = require('./openapi-generator');
const APIDocumentationGenerator = require('./api-documentation');

async function generateAllDocumentation() {
  console.log('🚀 Starting MindHub API documentation generation...\n');

  try {
    // Initialize generators
    const openApiGenerator = new OpenAPIGenerator();
    const docGenerator = new APIDocumentationGenerator();

    // Set output directory
    const outputDir = path.join(__dirname, '../../docs');
    console.log(`📁 Output directory: ${outputDir}\n`);

    // Generate OpenAPI specifications
    console.log('📊 Generating OpenAPI specifications...');
    const apiSpecs = await openApiGenerator.generateAllSpecs(path.join(outputDir, 'api'));
    console.log(`✅ Generated ${apiSpecs.length} OpenAPI specification files:`);
    apiSpecs.forEach(file => console.log(`   - ${path.basename(file)}`));
    console.log('');

    // Generate complete documentation
    console.log('📚 Generating complete documentation...');
    const docFiles = await docGenerator.generateDocumentation(outputDir);
    console.log(`✅ Generated ${docFiles.length} documentation files:`);
    
    // Group files by type
    const filesByType = docFiles.reduce((acc, file) => {
      const dir = path.dirname(file).split(path.sep).pop();
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(path.basename(file));
      return acc;
    }, {});

    Object.entries(filesByType).forEach(([type, files]) => {
      console.log(`   ${type}:`);
      files.forEach(file => console.log(`     - ${file}`));
    });

    console.log('\n🎉 Documentation generation completed successfully!');
    console.log('\nGenerated documentation includes:');
    console.log('• OpenAPI 3.0 specifications (JSON & YAML)');
    console.log('• Interactive Swagger UI');
    console.log('• ReDoc documentation');
    console.log('• Postman collection');
    console.log('• Markdown guides and tutorials');
    console.log('• Healthcare compliance documentation');
    console.log('• SDK examples and code samples');
    console.log('• Validation schemas and test data');

    console.log('\nNext steps:');
    console.log('1. Review generated documentation in ./docs');
    console.log('2. Host Swagger UI at /docs/interactive/swagger.html');
    console.log('3. Share Postman collection with developers');
    console.log('4. Update any service-specific documentation');

    return {
      success: true,
      files: docFiles,
      specs: apiSpecs,
      outputDir
    };

  } catch (error) {
    console.error('❌ Documentation generation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
MindHub API Documentation Generator

Usage: node generate-docs.js [options]

Options:
  --help, -h     Show this help message
  --output, -o   Specify output directory (default: ../../docs)
  --format, -f   Output format: json, yaml, both (default: both)
  --service, -s  Generate docs for specific service only

Examples:
  node generate-docs.js                    # Generate all documentation
  node generate-docs.js --service expedix  # Generate Expedix service docs only
  node generate-docs.js --format yaml      # Generate YAML format only
  node generate-docs.js --output ./custom  # Custom output directory

Healthcare Compliance:
  Generated documentation includes healthcare-specific annotations
  for NOM-024-SSA3-2010 and COFEPRIS compliance requirements.
`);
    process.exit(0);
  }

  generateAllDocumentation()
    .then(result => {
      console.log(`\n📊 Summary:`);
      console.log(`• Total files generated: ${result.files.length + result.specs.length}`);
      console.log(`• Output directory: ${result.outputDir}`);
      console.log(`• Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    })
    .catch(error => {
      console.error('Failed to generate documentation:', error);
      process.exit(1);
    });
}

module.exports = {
  generateAllDocumentation
};