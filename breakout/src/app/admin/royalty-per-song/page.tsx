import { PrismaClient } from "@prisma/client";
import { AdminRoyaltyPerSongClient } from "./AdminRoyaltyPerSongClient";
import { DollarSign } from "lucide-react";

const prisma = new PrismaClient();

export default async function AdminRoyaltyPerSongPage() {
  const data = await prisma.royaltyPerSong.findMany({
    include: {
      artist: { select: { id: true, stageName: true } },
      track: { select: { id: true, isrc: true, release: { select: { releaseDate: true } } } }
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
      { songName: 'asc' }
    ]
  });

  const artists = await prisma.artist.findMany({
    select: { id: true, stageName: true },
    orderBy: { stageName: 'asc' }
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            Royalty Per Song
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Manage detailed royalty records for each song by platform.</p>
        </div>
      </div>

      <AdminRoyaltyPerSongClient data={data as any} artists={artists} />
    </div>
  );
}
