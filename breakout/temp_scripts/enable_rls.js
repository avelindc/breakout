const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Fetching all tables in the 'public' schema...");
    
    // 1. Get all public tables except _prisma_migrations
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename != '_prisma_migrations';
    `;

    console.log(`Found ${tables.length} tables to secure.`);

    // 2. Loop through and enable RLS
    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`Enabling RLS for table: "${tableName}"`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
    }

    console.log("✅ Successfully enabled Row Level Security (RLS) on all public tables.");
    console.log("Since no policies are created, the Supabase Data API (anon key) is now completely blocked.");
    console.log("Your Next.js app (using Prisma as superuser) will continue to work perfectly.");

  } catch (error) {
    console.error("Error enabling RLS:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
