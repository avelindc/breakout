const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const r = await prisma.release.findFirst();
  console.log("URL:", r.coverArtworkUrl);
  try {
    const res = await fetch(r.coverArtworkUrl);
    console.log("Status:", res.status);
    console.log("Status Text:", res.statusText);
    const body = await res.text();
    console.log("Body snippet:", body.slice(0, 100));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
run().finally(() => prisma.$disconnect());
