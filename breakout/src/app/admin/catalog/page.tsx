import { PrismaClient } from "@prisma/client";
import { CatalogAdminClient } from "./CatalogAdminClient";

const prisma = new PrismaClient();

export default async function AdminCatalogPage() {
  const totalSongs = await prisma.catalogSong.count();
  
  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Katalog Musik</h1>
          <p className="text-gray-500 mt-1">Manage global music catalog</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">Total Lagu</p>
          <p className="text-4xl font-black text-blue-600">{totalSongs.toLocaleString('id-ID')} <span className="text-xl text-gray-400 font-medium">Lagu</span></p>
        </div>
      </div>

      <CatalogAdminClient initialTotal={totalSongs} />
    </div>
  );
}
