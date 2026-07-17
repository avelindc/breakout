const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  const files = [
    'c:\\Users\\avelin\\Documents\\nela-distribution\\CATALOG RPH.xlsx',
    'c:\\Users\\avelin\\Documents\\nela-distribution\\Katalog  PT Khana Media Nusantara 2025.xlsx',
    'c:\\Users\\avelin\\Documents\\nela-distribution\\Katalog Halo.xlsx'
  ];

  try {
    console.log("Loading existing records into memory...");
    const existingRecords = await prisma.catalogSong.findMany({
      select: { id: true, isrc: true, title: true, artist: true }
    });

    const isrcMap = new Set();
    const titleArtistMap = new Set();
    
    for (const record of existingRecords) {
      if (record.isrc) isrcMap.add(record.isrc);
      titleArtistMap.add(`${record.title.toLowerCase()}||${record.artist.toLowerCase()}`);
    }
    
    console.log(`Loaded ${existingRecords.length} records.`);

    let totalInserted = 0;

    for (const filePath of files) {
      console.log(`\nImporting: ${filePath}`);
      
      const workbook = XLSX.readFile(filePath);
      if (workbook.SheetNames.length === 0) continue;

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (rawData.length === 0) continue;

      const validRows = [];

      for (const row of rawData) {
        const getVal = (keys) => {
          for (const key of Object.keys(row)) {
            if (keys.includes(key.toLowerCase().trim())) {
              return row[key] ? String(row[key]).trim() : null;
            }
          }
          return null;
        };

        const title = getVal(['judul lagu', 'judul', 'title', 'song title', 'track', 'nama lagu', 'lagu']);
        const artist = getVal(['nama artis', 'artis', 'artist', 'primary artist', 'penyanyi', 'nama pencipta', 'pencipta', 'singer', 'performer', 'komposer', 'composer']);
        const publisher = getVal(['publisher', 'label', 'publishing']);
        const genre = getVal(['genre']);
        const isrc = getVal(['isrc', 'id ciptaan', 'song id']);
        const duration = getVal(['durasi', 'duration', 'time']);
        const year = getVal(['tahun', 'year']);

        if (!title || !artist) continue;
        
        // Dedup against memory maps
        let isDuplicate = false;
        if (isrc && isrcMap.has(isrc)) {
          isDuplicate = true;
        } else {
          const key = `${title.toLowerCase()}||${artist.toLowerCase()}`;
          if (titleArtistMap.has(key)) {
            isDuplicate = true;
          } else {
             // mark as seen so we don't insert it again
             titleArtistMap.add(key);
             if (isrc) isrcMap.add(isrc);
          }
        }

        if (!isDuplicate) {
          validRows.push({ title, artist, publisher, genre, isrc, duration, year });
        }
      }

      console.log(`Extracted ${validRows.length} NEW valid rows from ${filePath}.`);
      
      if (validRows.length > 0) {
        const BATCH_SIZE = 5000;
        for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
          const batch = validRows.slice(i, i + BATCH_SIZE);
          await prisma.catalogSong.createMany({
            data: batch,
            skipDuplicates: true
          });
          totalInserted += batch.length;
          console.log(`Inserted ${i + batch.length} of ${validRows.length}...`);
        }
      }
    }
    
    console.log(`\nAll done! Inserted a total of ${totalInserted} new songs.`);
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
