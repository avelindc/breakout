import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Disc, Plus } from "lucide-react";
import Link from "next/link";
import { UserReleasesClient } from "./UserReleasesClient";

const prisma = new PrismaClient();

export default async function MyReleasesPage() {
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { artists: { include: { releases: { orderBy: { createdAt: 'desc' } } } } }
  });

  const releases = user?.artists?.flatMap(a => a.releases).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-6 md:mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">My Releases</h1>
          <p className="text-gray-500 text-sm font-medium">{releases.length} releases found</p>
        </div>
        <Link href="/dashboard/upload" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> New Release
        </Link>
      </div>

      {releases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 md:p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <Disc className="w-16 h-16 text-gray-300 mb-5" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Releases Found</h2>
          <p className="text-gray-500 mb-8 max-w-md">You haven't uploaded any music yet. Start your journey by uploading your first track.</p>
          <Link href="/dashboard/upload" className="px-8 py-3.5 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition">
            Upload Music
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <UserReleasesClient releases={releases as any} />
        </div>
      )}
    </div>
  );
}
