const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const releases = await prisma.release.findMany({
    include: { tracks: true, artist: { include: { user: true } } }
  });

  const report = [];
  const toDelete = [];

  for (const release of releases) {
    let reason = null;
    let shouldDelete = false;

    if (!release.tracks || release.tracks.length === 0) {
      reason = 'No tracks / Empty tracks array';
      shouldDelete = true;
    } else {
      for (const track of release.tracks) {
        if (!track.audioUrl) {
          reason = 'Track missing audioUrl';
          break;
        }
        if (!track.title) {
          reason = 'Track missing title';
          break;
        }
      }
    }

    if (reason) {
      report.push({
        id: release.id,
        title: release.title,
        artist: release.primaryArtist || (release.artist && release.artist.user ? release.artist.user.name : 'Unknown'),
        trackCount: release.tracks ? release.tracks.length : 0,
        reason: reason
      });
      if (shouldDelete) {
        toDelete.push(release.id);
      }
    }
  }

  console.log('=== Laporan Release Bermasalah ===');
  console.table(report);
  console.log('\nTotal Release Bermasalah: ' + report.length);
  console.log('Total Release yang akan dihapus (karena tidak ada track): ' + toDelete.length);

  if (toDelete.length > 0) {
    console.log('\nMenghapus release yang tidak memiliki track...');
    const result = await prisma.release.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log('Berhasil menghapus ' + result.count + ' release.');
  } else {
    console.log('\nTidak ada release yang perlu dihapus.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
