const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Mencari lagu Khana yang sudah ada cover-nya...");
  
  // Find the entry that has a coverUrl
  const entryWithCover = await prisma.catalogKhana.findFirst({
    where: {
      coverUrl: { not: null },
    },
    orderBy: { updatedAt: 'desc' }
  });

  if (!entryWithCover || !entryWithCover.coverUrl) {
    console.log("Belum ada coverUrl yang ditemukan di Khana. Tolong upload dulu covernya ya.");
    return;
  }

  const targetCoverUrl = entryWithCover.coverUrl;
  console.log(`Ditemukan coverUrl Khana: ${targetCoverUrl}`);
  
  console.log("Menerapkan ke semua lagu Khana...");
  
  // Update all entries
  const result = await prisma.catalogKhana.updateMany({
    data: {
      coverUrl: targetCoverUrl
    }
  });

  console.log(`Berhasil mengupdate ${result.count} lagu Khana dengan cover tersebut!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
