const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.artist.deleteMany({
    where: {
      stageName: "mira stiawan"
    }
  });
  console.log("Deleted artist mira stiawan");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
