const fs = require('fs');
const PDFParser = require('pdf2json');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function parsePDF(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => resolve(pdfData));
    pdfParser.loadPDF(filePath);
  });
}

function decodeText(t) {
  // pdf2json uses encodeURIComponent, but sometimes there are raw '%'
  try {
    return decodeURIComponent(t);
  } catch (e) {
    return unescape(t);
  }
}

async function processPdf(filePath) {
  console.log('Processing', filePath);
  const data = await parsePDF(filePath);
  const rows = [];
  
  for (const page of data.Pages) {
    // group by y
    const yGroups = {};
    for (const text of page.Texts) {
      // y might have slight variations, round to 1 decimal
      const y = Math.round(text.y * 10) / 10;
      if (!yGroups[y]) yGroups[y] = [];
      yGroups[y].push({ x: text.x, text: decodeText(text.R[0].T).trim() });
    }
    
    // sort y
    const yKeys = Object.keys(yGroups).map(Number).sort((a, b) => a - b);
    
    for (const y of yKeys) {
      const items = yGroups[y].sort((a, b) => a.x - b.x);
      // We know columns are roughly at X boundaries:
      // ID CIPTAAN: ~4.8
      // JUDUL LAGU: ~6.6
      // NAMA PENCIPTA: ~16.7
      // NAMA ALIAS PENCIPTA: ~24.9
      // PUBLISHER: ~31.5
      
      let id = '', title = '', pencipta = '', alias = '', publisher = '';
      
      for (const item of items) {
        if (item.x < 4) continue; // NO
        else if (item.x < 6) id += item.text + ' ';
        else if (item.x < 16) title += item.text + ' ';
        else if (item.x < 24) pencipta += item.text + ' ';
        else if (item.x < 31) alias += item.text + ' ';
        else publisher += item.text + ' ';
      }
      
      id = id.trim();
      title = title.trim();
      pencipta = pencipta.trim();
      alias = alias.trim();
      publisher = publisher.trim();
      
      if (title && pencipta && title !== 'JUDUL LAGU') {
        rows.push({
          title,
          artist: alias || pencipta,
          publisher: publisher || 'pt. pragita prabawa pustaka',
          isrc: id,
          genre: 'Pop', // default or empty
        });
      }
    }
  }
  return rows;
}

async function main() {
  const file1 = 'C:/Users/avelin/.gemini/antigravity-ide/brain/75bb032b-494f-4457-a760-ee7ad34b5291/media__1784296436521.pdf';
  const file2 = 'C:/Users/avelin/.gemini/antigravity-ide/brain/75bb032b-494f-4457-a760-ee7ad34b5291/media__1784296442776.pdf';
  
  try {
    console.log('Starting extraction...');
    const rows1 = await processPdf(file1);
    const rows2 = await processPdf(file2); // Might have different X coords, we'll see
    
    let allRows = [...rows1, ...rows2];
    console.log(`Extracted ${allRows.length} rows.`);
    
    // Batch insert into DB
    let successCount = 0;
    const BATCH_SIZE = 500;
    
    // Quick dedup by title+artist
    const uniqueRowsMap = new Map();
    for (const r of allRows) {
        uniqueRowsMap.set(r.title + '|' + r.artist, r);
    }
    const uniqueRows = Array.from(uniqueRowsMap.values());
    console.log(`Unique rows: ${uniqueRows.length}`);
    
    for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
      const batch = uniqueRows.slice(i, i + BATCH_SIZE);
      await prisma.catalogSong.createMany({
        data: batch,
        skipDuplicates: true
      });
      successCount += batch.length;
      console.log(`Inserted batch ${i} to ${i + batch.length}`);
    }
    
    console.log(`Successfully inserted ${successCount} songs to database!`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
