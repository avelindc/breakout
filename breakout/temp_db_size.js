const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRaw`
    SELECT pg_size_pretty(pg_database_size(current_database())) AS "db_size";
  `;
  console.log(result);
}
main().finally(() => prisma.$disconnect());
