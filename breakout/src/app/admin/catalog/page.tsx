import { PrismaClient } from "@prisma/client";
import { CatalogAdminClient } from "./CatalogAdminClient";

const prisma = new PrismaClient();

export default async function AdminCatalogPage() {
  const totalSongs = await prisma.catalogSong.count();
  
  return (
    <div className="p-8 min-h-screen bg-blue-600">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Katalog Musik</h1>
          <p className="text-blue-200 mt-1">Manage global music catalog</p>
        </div>
      </div>

      <div className="bg-blue-700/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-blue-500/30 mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-200 font-medium mb-1">Total Lagu</p>
          <p className="text-4xl font-black text-white">{totalSongs.toLocaleString('id-ID')} <span className="text-xl text-blue-300 font-medium">Lagu</span></p>
        </div>
      </div>

      <CatalogAdminClient initialTotal={totalSongs} />
    </div>
  );
}
