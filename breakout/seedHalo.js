const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const dataPath = 'C:\\\\Users\\\\avelin\\\\.gemini\\\\antigravity-ide\\\\brain\\\\2d6b1292-bebf-48d1-bd7e-37255cbbf64b\\\\scratch\\\\read-excel\\\\output.json';
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // Skip header row
  const rows = data.slice(1);
  
  console.log(`Preparing to seed ${rows.length} rows to CatalogHalo...`);
  
  const batchSize = 1000;
  let successCount = 0;
  
  const batchData = [];
  
  for (const row of rows) {
    if (!row || row.length < 5) continue;
    
    // SONG ID, JUDUL LAGU, KOMPOSER, PUBLISHER, PERFORMER, YOUTUBE LINK REFERENCE
    const songId = String(row[0] || '').trim();
    const title = String(row[1] || '').trim();
    const composer = String(row[2] || '').trim();
    const publisher = String(row[3] || '').trim();
    const performer = String(row[4] || '').trim();
    let youtubeUrl = row.length > 5 ? String(row[5] || '').trim() : null;
    
    if (!title || title === 'undefined') continue;
    if (youtubeUrl === '-' || youtubeUrl === '' || youtubeUrl === 'undefined' || youtubeUrl === 'null') youtubeUrl = null;
    
    batchData.push({
      songId: songId === 'undefined' ? null : songId,
      title,
      composer: composer === 'undefined' ? '' : composer,
      publisher: publisher === 'undefined' ? null : publisher,
      performer: performer === 'undefined' ? '' : performer,
      youtubeUrl
    });
  }
  
  console.log(`Parsed ${batchData.length} valid entries. Seeding in batches of ${batchSize}...`);
  
  for (let i = 0; i < batchData.length; i += batchSize) {
    const batch = batchData.slice(i, i + batchSize);
    await prisma.catalogHalo.createMany({
      data: batch,
      skipDuplicates: true
    });
    successCount += batch.length;
    console.log(`Seeded batch ${i / batchSize + 1}: ${successCount} / ${batchData.length}`);
  }
  
  console.log(`Successfully seeded ${successCount} CatalogHalo entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
