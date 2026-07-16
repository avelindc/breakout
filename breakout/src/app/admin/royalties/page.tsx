import { PrismaClient } from "@prisma/client";
import { addRoyaltyAction } from "@/app/actions/royalties";
import { DollarSign, Save } from "lucide-react";
import { RoyaltyForm } from "@/components/RoyaltyForm";

const prisma = new PrismaClient();

export default async function AdminRoyaltiesPage() {
  const artists = await prisma.artist.findMany({
    where: {
      releases: {
        some: {} // Only include artists who have at least one release
      }
    },
    include: { releases: true },
    orderBy: { stageName: 'asc' }
  });

  const recentRoyalties = await prisma.royalty.findMany({
    include: { artist: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Royalty Management</h1>
        <p className="text-gray-500">Input stream counts and revenue for artists.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Add Royalty Data
          </h2>

          <RoyaltyForm artists={artists} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Entries</h2>
          <div className="space-y-4">
            {recentRoyalties.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No data yet.</p>
            ) : (
              recentRoyalties.map((r) => (
                <div key={r.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0">
                  <div>
                    <h4 className="font-bold text-gray-900">{r.songName}</h4>
                    <p className="text-xs text-gray-500">{r.artist.stageName} • {r.month}/{r.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">Rp {r.totalRevenue.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
