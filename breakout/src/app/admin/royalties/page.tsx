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
    include: { artist: { include: { user: true } } },
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
            <span>Recent Entries</span>
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{recentRoyalties.length} latest</span>
          </h2>
          <div className="space-y-3">
            {recentRoyalties.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500">No data yet.</p>
              </div>
            ) : (
              recentRoyalties.map((r) => {
                const profileImage = r.artist.avatarUrl || r.artist.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.artist.stageName}`;
                
                return (
                  <div key={r.id} className="group flex justify-between items-center p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl border border-transparent hover:border-blue-100 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm shrink-0 border-2 border-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profileImage} alt={r.artist.stageName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors line-clamp-1">{r.songName}</h4>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{r.artist.stageName}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full">
                          {new Date(r.year, r.month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-center ml-2 shrink-0">
                      <p className="text-[10px] text-gray-400 font-medium mb-1">Total Revenue</p>
                      <p className="font-bold text-green-600 bg-green-50 px-2 sm:px-3 py-1.5 rounded-lg border border-green-100 text-sm">
                        Rp {r.totalRevenue.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
