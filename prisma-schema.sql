// Prisma schema for ClinimetrixPro MVP - PostgreSQL
// This file should replace the schema.prisma file in the new project

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Pacientes simplificados (sin información sensible)
model SimplePatient {
  id        String   @id @default(cuid())
  name      String?  @db.VarChar(100)
  age       Int?
  sex       String?  @db.Char(1) // 'M', 'F', 'O'
  userId    String   @map("user_id") @db.VarChar(255) // Clerk user ID
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  assessments ClinimetrixAssessment[]

  @@map("simple_patients")
}

// Templates de escalas ClinimetrixPro
model ClinimetrixTemplate {
  id           String   @id @db.VarChar(255)
  templateData Json     @map("template_data") // JSONB en PostgreSQL
  version      String?  @db.VarChar(50)
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relaciones
  assessments    ClinimetrixAssessment[]
  registryEntries ClinimetrixRegistry[]

  @@map("clinimetrix_templates")
}

// Evaluaciones/Assessments
model ClinimetrixAssessment {
  id          String    @id @default(cuid())
  templateId  String    @map("template_id") @db.VarChar(255)
  patientId   String?   @map("patient_id")
  userId      String    @map("user_id") @db.VarChar(255) // Clerk user ID
  responses   Json?     // JSONB en PostgreSQL
  results     Json?     // JSONB en PostgreSQL
  status      String    @default("in_progress") @db.VarChar(50)
  createdAt   DateTime  @default(now()) @map("created_at")
  completedAt DateTime? @map("completed_at")

  // Relaciones
  template ClinimetrixTemplate @relation(fields: [templateId], references: [id])
  patient  SimplePatient?      @relation(fields: [patientId], references: [id])

  @@map("clinimetrix_assessments")
}

// Registro/Catálogo de escalas
model ClinimetrixRegistry {
  id          String   @id @db.VarChar(255)
  templateId  String   @map("template_id") @db.VarChar(255)
  name        String?  @db.VarChar(255)
  abbreviation String? @db.VarChar(50)
  category    String?  @db.VarChar(100)
  description String?  @db.Text
  isFeatured  Boolean  @default(false) @map("is_featured")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relaciones
  template ClinimetrixTemplate @relation(fields: [templateId], references: [id])

  @@map("clinimetrix_registry")
}