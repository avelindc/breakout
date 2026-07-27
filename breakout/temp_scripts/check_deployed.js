async function checkDeployedCode() {
  try {
    const r = await fetch('https://www.breakoutmusic.online/admin/releases');
    const html = await r.text();
    const match = html.match(/<script src="(\/_next\/static\/chunks\/app\/admin\/releases\/page-[^"]+\.js)"/);
    if (match) {
      const jsRes = await fetch('https://www.breakoutmusic.online' + match[1]);
      const jsText = await jsRes.text();
      if (jsText.includes('Pastikan koneksi stabil')) {
        console.log('✅ NEW CODE DEPLOYED');
      } else if (jsText.includes('URL valid dan CORS diizinkan')) {
        console.log('❌ OLD CODE DETECTED');
      } else {
        console.log('⚠️ NEITHER DETECTED');
      }
    } else {
      console.log('Chunk not found in HTML');
    }
  } catch(e) {
    console.error(e);
  }
}
checkDeployedCode();
