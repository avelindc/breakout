import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.settings.findUnique({
    where: { key: "LANDING_PAGE_CMS" }
  });
  console.log(setting);
}

main().catch(console.error).finally(() => prisma.$disconnect());
