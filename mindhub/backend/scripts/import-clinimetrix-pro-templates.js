/**
 * ClinimetrixPro Template Importer
 * 
 * This script imports JSON-based scale templates into the ClinimetrixPro database
 * It processes all templates from the templates/scales directory and creates
 * corresponding database entries with proper validation and indexing.
 * 
 * Usage: DB_PASSWORD=yourpassword node scripts/import-clinimetrix-pro-templates.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Database configuration
const dbConfig = {
    host: 'localhost',
    port: 8889,
    user: 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: 'mindhub',
    charset: 'utf8mb4'
};

// Template directory path
const TEMPLATES_DIR = path.join(__dirname, '../templates/scales');

/**
 * Calculate MD5 hash of template JSON for version control
 */
function calculateTemplateHash(templateJson) {
    return crypto.createHash('md5').update(JSON.stringify(templateJson)).digest('hex');
}

/**
 * Generate a unique ID for the template
 */
function generateTemplateId(templateData) {
    const abbreviation = templateData.metadata.abbreviation.toLowerCase();
    const version = templateData.metadata.version;
    return `template-${abbreviation}-${version}`;
}

/**
 * Validate template structure and completeness
 */
function validateTemplate(templateData, filename) {
    const errors = [];
    
    // Check required metadata fields
    if (!templateData.metadata) {
        errors.push('Missing metadata section');
        return errors;
    }

    const required = ['id', 'name', 'abbreviation', 'version', 'category'];
    required.forEach(field => {
        if (!templateData.metadata[field]) {
            errors.push(`Missing required metadata field: ${field}`);
        }
    });

    // Check structure section
    if (!templateData.structure) {
        errors.push('Missing structure section');
    } else {
        if (!templateData.structure.sections || !Array.isArray(templateData.structure.sections)) {
            errors.push('Missing or invalid structure.sections array');
        }
        if (typeof templateData.structure.totalItems !== 'number') {
            errors.push('Missing or invalid structure.totalItems');
        }
    }

    // Check scoring section
    if (!templateData.scoring) {
        errors.push('Missing scoring section');
    } else {
        if (!templateData.scoring.method) {
            errors.push('Missing scoring.method');
        }
        if (!templateData.scoring.scoreRange) {
            errors.push('Missing scoring.scoreRange');
        }
    }

    // Check interpretation section
    if (!templateData.interpretation) {
        errors.push('Missing interpretation section');
    } else {
        if (!templateData.interpretation.rules || !Array.isArray(templateData.interpretation.rules)) {
            errors.push('Missing or invalid interpretation.rules array');
        }
    }

    // Validate items structure
    if (templateData.structure.sections) {
        templateData.structure.sections.forEach((section, sectionIndex) => {
            if (!section.items || !Array.isArray(section.items)) {
                errors.push(`Section ${sectionIndex} missing items array`);
            } else {
                section.items.forEach((item, itemIndex) => {
                    if (typeof item.number !== 'number') {
                        errors.push(`Section ${sectionIndex}, item ${itemIndex} missing item number`);
                    }
                    if (!item.text) {
                        errors.push(`Section ${sectionIndex}, item ${itemIndex} missing text`);
                    }
                    if (!item.responseType) {
                        errors.push(`Section ${sectionIndex}, item ${itemIndex} missing responseType`);
                    }
                });
            }
        });
    }

    return errors;
}

/**
 * Extract registry information from template
 */
function extractRegistryInfo(templateData) {
    const metadata = templateData.metadata;
    const documentation = templateData.documentation || {};
    const psychometricProps = documentation.psychometricProperties || {};
    
    return {
        display_name: metadata.name,
        short_description: metadata.description || `${metadata.name} - ${metadata.category}`,
        detailed_description: documentation.description || null,
        keywords: JSON.stringify([
            metadata.abbreviation,
            metadata.category,
            metadata.subcategory,
            ...(metadata.authors || [])
        ].filter(Boolean)),
        tags: JSON.stringify([
            metadata.category,
            metadata.subcategory,
            metadata.administrationMode,
            metadata.language
        ].filter(Boolean)),
        difficulty_level: 'intermediate', // Default, can be overridden per template
        certification_required: templateData.metadata.abbreviation === 'PANSS', // PANSS requires training
        age_groups: JSON.stringify(metadata.targetPopulation?.ageGroups || ['adulto']),
        clinical_conditions: JSON.stringify([metadata.category, metadata.subcategory].filter(Boolean)),
        contraindications: JSON.stringify(
            templateData.interpretation?.clinicalGuidelines?.contraindications || []
        ),
        special_considerations: templateData.interpretation?.clinicalGuidelines?.specialConsiderations?.join('; ') || null,
        psychometric_properties: JSON.stringify(psychometricProps),
        bibliography: JSON.stringify(documentation.bibliography || []),
        normative_data: JSON.stringify(documentation.normativeData || null),
        cutoff_points: JSON.stringify(documentation.normativeData?.cutoffPoints || []),
        sensitivity_specificity: JSON.stringify({
            sensitivity: psychometricProps.validity?.sensitivity || null,
            specificity: psychometricProps.validity?.specificity || null
        }),
        is_featured: ['PANSS', 'MOCA', 'DY-BOCS'].includes(metadata.abbreviation),
        is_recommended: ['STAI', 'GDS', 'BDI-21'].includes(metadata.abbreviation),
        popularity_score: Math.random() * 100, // Placeholder - would be calculated from usage
        usage_count_total: 0,
        usage_count_30d: 0,
        published_at: new Date(),
        reviewed_at: new Date(),
        reviewed_by: 'system' // Would be actual user ID in production
    };
}

/**
 * Import a single template into the database
 */
async function importTemplate(connection, templateData, filename) {
    try {
        console.log(`\n📋 Processing template: ${templateData.metadata.name} (${templateData.metadata.abbreviation})`);
        
        // Validate template
        const validationErrors = validateTemplate(templateData, filename);
        if (validationErrors.length > 0) {
            console.error(`❌ Validation failed for ${filename}:`);
            validationErrors.forEach(error => console.error(`   - ${error}`));
            return false;
        }

        const templateId = generateTemplateId(templateData);
        const templateHash = calculateTemplateHash(templateData);
        const templateJson = JSON.stringify(templateData);
        
        // Check if template already exists
        const [existingTemplate] = await connection.execute(
            'SELECT id, template_hash FROM clinimetrix_templates WHERE id = ? OR abbreviation = ?',
            [templateId, templateData.metadata.abbreviation]
        );

        if (existingTemplate.length > 0) {
            const existing = existingTemplate[0];
            if (existing.template_hash === templateHash) {
                console.log(`⏭️  Template ${templateData.metadata.abbreviation} already exists with same content - skipping`);
                return true;
            } else {
                console.log(`🔄 Template ${templateData.metadata.abbreviation} exists but has different content - updating`);
                
                // Update existing template
                await connection.execute(`
                    UPDATE clinimetrix_templates 
                    SET template_json = ?, 
                        template_hash = ?, 
                        updated_at = CURRENT_TIMESTAMP,
                        is_validated = FALSE,
                        validation_errors = NULL
                    WHERE id = ?
                `, [templateJson, templateHash, existing.id]);
                
                // Update registry
                const registryInfo = extractRegistryInfo(templateData);
                await connection.execute(`
                    UPDATE clinimetrix_registry 
                    SET display_name = ?,
                        short_description = ?,
                        detailed_description = ?,
                        keywords = ?,
                        tags = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE template_id = ?
                `, [
                    registryInfo.display_name,
                    registryInfo.short_description,
                    registryInfo.detailed_description,
                    registryInfo.keywords,
                    registryInfo.tags,
                    existing.id
                ]);
                
                console.log(`✅ Updated template: ${templateData.metadata.abbreviation}`);
                return true;
            }
        }

        // Insert new template
        await connection.execute(`
            INSERT INTO clinimetrix_templates (
                id, name, abbreviation, version, category, subcategory,
                template_json, template_hash, is_active, is_validated,
                created_by, estimated_duration_minutes, target_population,
                administration_mode, language, compatibility_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, 'system', ?, ?, ?, ?, 'stable')
        `, [
            templateId,
            templateData.metadata.name,
            templateData.metadata.abbreviation,
            templateData.metadata.version,
            templateData.metadata.category,
            templateData.metadata.subcategory || null,
            templateJson,
            templateHash,
            templateData.metadata.estimatedDurationMinutes || null,
            JSON.stringify(templateData.metadata.targetPopulation || null),
            templateData.metadata.administrationMode || 'both',
            templateData.metadata.language || 'es'
        ]);

        // Insert into registry
        const registryInfo = extractRegistryInfo(templateData);
        const registryId = `registry-${templateData.metadata.abbreviation.toLowerCase()}-${Date.now()}`;
        
        await connection.execute(`
            INSERT INTO clinimetrix_registry (
                id, template_id, display_name, short_description, detailed_description,
                keywords, tags, difficulty_level, certification_required,
                age_groups, clinical_conditions, contraindications, special_considerations,
                psychometric_properties, bibliography, normative_data, cutoff_points,
                sensitivity_specificity, is_featured, is_recommended, popularity_score,
                usage_count_total, usage_count_30d, published_at, reviewed_at, reviewed_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            registryId,
            templateId,
            registryInfo.display_name,
            registryInfo.short_description,
            registryInfo.detailed_description,
            registryInfo.keywords,
            registryInfo.tags,
            registryInfo.difficulty_level,
            registryInfo.certification_required,
            registryInfo.age_groups,
            registryInfo.clinical_conditions,
            registryInfo.contraindications,
            registryInfo.special_considerations,
            registryInfo.psychometric_properties,
            registryInfo.bibliography,
            registryInfo.normative_data,
            registryInfo.cutoff_points,
            registryInfo.sensitivity_specificity,
            registryInfo.is_featured,
            registryInfo.is_recommended,
            registryInfo.popularity_score,
            registryInfo.usage_count_total,
            registryInfo.usage_count_30d,
            registryInfo.published_at,
            registryInfo.reviewed_at,
            registryInfo.reviewed_by
        ]);

        console.log(`✅ Successfully imported: ${templateData.metadata.abbreviation}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Error importing ${filename}:`, error.message);
        return false;
    }
}

/**
 * Main import function
 */
async function importAllTemplates() {
    let connection;
    
    try {
        console.log('🚀 Starting ClinimetrixPro template import...\n');
        
        // Connect to database
        console.log('📡 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');

        // Check if tables exist
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'clinimetrix_%'
        `, [dbConfig.database]);
        
        if (tables.length === 0) {
            throw new Error('ClinimetrixPro tables not found. Please run the database migrations first.');
        }
        console.log(`✅ Found ${tables.length} ClinimetrixPro tables`);

        // Read template files
        console.log('\n📁 Reading template files...');
        const files = await fs.readdir(TEMPLATES_DIR);
        const templateFiles = files.filter(file => file.endsWith('.json'));
        
        if (templateFiles.length === 0) {
            throw new Error(`No JSON template files found in ${TEMPLATES_DIR}`);
        }
        
        console.log(`📋 Found ${templateFiles.length} template files`);

        // Process each template
        let successCount = 0;
        let errorCount = 0;
        
        for (const filename of templateFiles) {
            try {
                const filePath = path.join(TEMPLATES_DIR, filename);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const templateData = JSON.parse(fileContent);
                
                const success = await importTemplate(connection, templateData, filename);
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                }
                
            } catch (error) {
                console.error(`❌ Error processing file ${filename}:`, error.message);
                errorCount++;
            }
        }

        // Summary
        console.log('\n📊 Import Summary:');
        console.log(`✅ Successfully imported: ${successCount} templates`);
        console.log(`❌ Failed imports: ${errorCount} templates`);
        console.log(`📋 Total processed: ${templateFiles.length} files`);

        // Verify imports
        console.log('\n🔍 Verifying imports...');
        const [templateCount] = await connection.execute('SELECT COUNT(*) as count FROM clinimetrix_templates');
        const [registryCount] = await connection.execute('SELECT COUNT(*) as count FROM clinimetrix_registry');
        
        console.log(`📋 Templates in database: ${templateCount[0].count}`);
        console.log(`📚 Registry entries: ${registryCount[0].count}`);

        // Show imported templates
        const [importedTemplates] = await connection.execute(`
            SELECT abbreviation, name, version, category, is_active, created_at
            FROM clinimetrix_templates 
            ORDER BY abbreviation
        `);
        
        console.log('\n📋 Imported Templates:');
        importedTemplates.forEach(template => {
            console.log(`   ${template.abbreviation} - ${template.name} (v${template.version}) [${template.category}]`);
        });

        console.log('\n🎉 ClinimetrixPro template import completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the import
if (require.main === module) {
    importAllTemplates().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    importAllTemplates,
    importTemplate,
    validateTemplate,
    calculateTemplateHash,
    generateTemplateId
};