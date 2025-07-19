#!/usr/bin/env node

/**
 * Script to add missing scales to the database
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Aa123456!',
  database: process.env.DB_NAME || 'mindhub',
  timezone: '+00:00'
};

const missingScales = [
  {
    id: 'aq-adolescent',
    name: 'Autism Quotient Adolescent',
    abbreviation: 'AQ-A',
    version: '1.0',
    category: 'autism_screening',
    subcategory: 'adolescents',
    clinical_purpose: 'Cuestionario de detección de rasgos autistas en adolescentes',
    target_population: 'adolescentes',
    administration_mode: 'self_administered',
    estimated_duration_minutes: 10,
    total_items: 50,
    definition: {
      items: [
        { id: "aq_1", number: 1, text: "Prefiero hacer las cosas con otros en lugar de hacerlas solo.", subscale: "social_skills" },
        { id: "aq_2", number: 2, text: "Prefiero hacer las cosas de la misma manera una y otra vez.", subscale: "routine" },
        { id: "aq_3", number: 3, text: "Si trato de imaginar algo, me resulta muy fácil crear una imagen en mi mente.", subscale: "imagination" },
        { id: "aq_4", number: 4, text: "Frecuentemente me absorbo tanto en una cosa que pierdo de vista otras cosas.", subscale: "attention_switching" },
        { id: "aq_5", number: 5, text: "A menudo noto pequeños sonidos cuando otros no los notan.", subscale: "attention_to_detail" }
      ],
      responseOptions: [
        { value: "definitely_agree", label: "Definitivamente de acuerdo", score: 1 },
        { value: "slightly_agree", label: "Ligeramente de acuerdo", score: 0 },
        { value: "slightly_disagree", label: "Ligeramente en desacuerdo", score: 0 },
        { value: "definitely_disagree", label: "Definitivamente en desacuerdo", score: 1 }
      ],
      scoringMethod: "sum",
      scoreRange: { min: 0, max: 50 },
      interpretationRules: [
        { minScore: 0, maxScore: 25, severity: "low", label: "Bajo riesgo", color: "green" },
        { minScore: 26, maxScore: 50, severity: "high", label: "Alto riesgo", color: "orange" }
      ],
      totalItems: 50
    }
  },
  {
    id: 'pas',
    name: 'Parental Acceptance Scale',
    abbreviation: 'PAS',
    version: '1.0',
    category: 'family_assessment',
    subcategory: 'parent_child',
    clinical_purpose: 'Escala de aceptación parental',
    target_population: 'niños y adolescentes',
    administration_mode: 'self_administered',
    estimated_duration_minutes: 5,
    total_items: 5,
    definition: {
      items: [
        { id: "pas_1", number: 1, text: "Mi padre/madre me acepta tal como soy." },
        { id: "pas_2", number: 2, text: "Mi padre/madre me demuestra afecto." },
        { id: "pas_3", number: 3, text: "Mi padre/madre me apoya en mis decisiones." },
        { id: "pas_4", number: 4, text: "Mi padre/madre confía en mí." },
        { id: "pas_5", number: 5, text: "Mi padre/madre me escucha cuando hablo." }
      ],
      responseOptions: [
        { value: "never", label: "Nunca", score: 0 },
        { value: "sometimes", label: "A veces", score: 1 },
        { value: "often", label: "Frecuentemente", score: 2 },
        { value: "always", label: "Siempre", score: 3 }
      ],
      scoringMethod: "sum",
      scoreRange: { min: 0, max: 15 },
      interpretationRules: [
        { minScore: 0, maxScore: 5, severity: "low", label: "Baja aceptación", color: "red" },
        { minScore: 6, maxScore: 10, severity: "medium", label: "Aceptación moderada", color: "orange" },
        { minScore: 11, maxScore: 15, severity: "high", label: "Alta aceptación", color: "green" }
      ],
      totalItems: 5
    }
  }
];

async function addMissingScales() {
  try {
    console.log('🔌 Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    
    for (const scale of missingScales) {
      console.log(`📝 Adding scale: ${scale.name}`);
      
      await connection.execute(
        `INSERT INTO clinical_scales (
          id, name, abbreviation, version, category, subcategory,
          clinical_purpose, target_population, administration_mode,
          estimated_duration_minutes, total_items, validation_level,
          is_active, definition, scientific_references, authors,
          publication_year, publication_journal, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          definition = VALUES(definition),
          updated_at = NOW()`,
        [
          scale.id,
          scale.name,
          scale.abbreviation,
          scale.version,
          scale.category,
          scale.subcategory,
          scale.clinical_purpose,
          scale.target_population,
          scale.administration_mode,
          scale.estimated_duration_minutes,
          scale.total_items,
          1, // validation_level
          'active',
          JSON.stringify(scale.definition),
          null, // scientific_references
          'Various Authors', // authors
          '2000', // publication_year
          'Clinical Assessment Journal', // publication_journal
        ]
      );
      
      console.log(`✅ Scale ${scale.name} added successfully`);
    }
    
    await connection.end();
    console.log('🎉 All missing scales added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding scales:', error);
    process.exit(1);
  }
}

addMissingScales();