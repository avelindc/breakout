const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.settings.findUnique({where: {key: 'LANDING_PAGE_CMS'}})
  .then(res => console.log(res ? res.value : "not found"))
  .finally(() => prisma.$disconnect());
