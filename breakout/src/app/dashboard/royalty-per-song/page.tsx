import { PrismaClient } from "@prisma/client";
import { UserRoyaltyPerSongClient } from "./UserRoyaltyPerSongClient";
import { DollarSign } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

const prisma = new PrismaClient();

export default async function UserRoyaltyPerSongPage() {
  const session = await getServerSession(authOptions);
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { artists: { select: { id: true } } }
  });

  const artistIds = user?.artists.map(a => a.id) || [];

  const data = await prisma.royaltyPerSong.findMany({
    where: { artistId: { in: artistIds } },
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

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          Royalty Per Song
        </h1>
        <p className="text-blue-100 mt-3 font-medium max-w-2xl">
          Detailed royalty earnings for your catalog broken down by individual platform. Data is updated based on our official royalty reports.
        </p>
      </div>

      <UserRoyaltyPerSongClient data={data as any} />
    </div>
  );
}
