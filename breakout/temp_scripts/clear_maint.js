const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.settings.update({
    where: { key: 'maintenance_start' },
    data: { value: '' }
  });
  await prisma.settings.update({
    where: { key: 'maintenance_end' },
    data: { value: '' }
  });
  console.log("Cleared maintenance dates in DB");
}
main().finally(() => prisma.$disconnect());
