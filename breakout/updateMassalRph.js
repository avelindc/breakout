const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Mencari lagu yang sudah ada cover-nya...");
  
  // Find the entry that has a coverUrl
  const entryWithCover = await prisma.catalogRph.findFirst({
    where: {
      coverUrl: { not: null },
    },
    orderBy: { updatedAt: 'desc' }
  });

  if (!entryWithCover || !entryWithCover.coverUrl) {
    console.log("Belum ada coverUrl yang ditemukan. Tolong upload dulu covernya ya.");
    return;
  }

  const targetCoverUrl = entryWithCover.coverUrl;
  console.log(`Ditemukan coverUrl: ${targetCoverUrl}`);
  
  console.log("Menerapkan ke semua lagu...");
  
  // Update all entries
  const result = await prisma.catalogRph.updateMany({
    data: {
      coverUrl: targetCoverUrl
    }
  });

  console.log(`Berhasil mengupdate ${result.count} lagu dengan cover tersebut!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
