async function run() {
  const url = "https://c1aaf27f910711776d0d2b338cc1ce46.r2.cloudflarestorage.com/releases/test-cors.txt";
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://breakoutmusic.online",
      "Access-Control-Request-Method": "PUT",
      "Access-Control-Request-Headers": "content-type"
    }
  });

  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log("Body:", text);
}

run().catch(console.error);
