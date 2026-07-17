import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // @ts-ignore
  if (session.user.role !== 'ADMIN') {
    redirect("/dashboard");
  }

  const artists = await prisma.artist.findMany({
    select: { id: true, stageName: true }
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <AdminSidebar artists={artists} />
      <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto min-h-screen bg-gray-50 w-full">
        <div className="max-w-7xl mx-auto">
          
          {/* Horizontal Artist Bar */}
          {artists.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              <span className="text-sm font-bold text-gray-500 whitespace-nowrap mr-2">ARTISTS:</span>
              {artists.map(artist => (
                <a 
                  key={artist.id} 
                  href={`/admin/artists?artistId=${artist.id}`} 
                  className="whitespace-nowrap px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition"
                >
                  {artist.stageName}
                </a>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
