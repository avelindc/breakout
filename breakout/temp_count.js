const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tables = ['User', 'Artist', 'Release', 'Track', 'Streaming', 'Royalty', 'WithdrawRequest', 'Notification', 'ActivityLog', 'Message', 'MessageRecipient', 'CatalogSong', 'PublisherCatalogSong', 'ImportLog', 'UnmatchedSong', 'CatalogRph', 'CatalogKhana', 'CatalogHalo', 'RoyaltyPerSong'];
  for (const table of tables) {
    try {
      const count = await prisma[table[0].toLowerCase() + table.slice(1)].count();
      console.log(table, ':', count);
    } catch (e) {
      console.error('Error on table', table, e.message);
    }
  }
}
main().finally(() => prisma.$disconnect());
