/**
 * Create waiting_list table
 */

const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function createWaitingListTable() {
  try {
    console.log('🔧 Creating waiting_list table...');
    
    // Create the table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS \`waiting_list\` (
        \`id\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`patientId\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`appointmentType\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`preferredDates\` json NOT NULL,
        \`preferredTimes\` json NOT NULL,
        \`priority\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'media',
        \`notes\` text COLLATE utf8mb4_unicode_ci,
        \`status\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'waiting',
        \`contactAttempts\` int NOT NULL DEFAULT 0,
        \`lastContactDate\` datetime(3) DEFAULT NULL,
        \`scheduledDate\` datetime(3) DEFAULT NULL,
        \`createdBy\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user-dr-alejandro',
        \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`waiting_list_patientId_idx\` (\`patientId\`),
        KEY \`waiting_list_status_idx\` (\`status\`),
        KEY \`waiting_list_priority_idx\` (\`priority\`),
        CONSTRAINT \`waiting_list_patientId_fkey\` FOREIGN KEY (\`patientId\`) REFERENCES \`patients\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    console.log('✅ Table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating waiting list table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createWaitingListTable().catch(console.error);
}

module.exports = { createWaitingListTable };