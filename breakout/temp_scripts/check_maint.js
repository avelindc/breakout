const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.settings.findMany({ where: { key: { startsWith: 'maintenance_' } } });
  console.log(settings);
}
main().finally(() => prisma.$disconnect());
