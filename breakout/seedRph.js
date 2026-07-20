const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const dataPath = 'C:\\\\Users\\\\avelin\\\\.gemini\\\\antigravity-ide\\\\brain\\\\2d6b1292-bebf-48d1-bd7e-37255cbbf64b\\\\scratch\\\\read-excel\\\\output.json';
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // Skip header row
  const rows = data.slice(1);
  
  console.log(`Seeding ${rows.length} rows to CatalogRph...`);
  let count = 0;
  
  for (const row of rows) {
    if (!row || row.length < 4) continue;
    
    // No, Title, Singer, Composer, Youtube link
    const title = String(row[1] || '').trim();
    const singer = String(row[2] || '').trim();
    const composer = String(row[3] || '').trim();
    let youtubeUrl = String(row[4] || '').trim();
    
    if (!title || !singer || title === 'undefined') continue;
    if (youtubeUrl === '-' || youtubeUrl === '' || youtubeUrl === 'undefined') youtubeUrl = null;
    
    await prisma.catalogRph.create({
      data: {
        title,
        singer,
        composer,
        youtubeUrl
      }
    });
    count++;
  }
  
  console.log(`Successfully seeded ${count} CatalogRph entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
