import { PrismaClient } from "@prisma/client";
import { PublisherCatalogAdminClient } from "./PublisherCatalogAdminClient";
import { BookOpen } from "lucide-react";

const prisma = new PrismaClient();

export default async function AdminPublisherCatalogPage() {
  const total = await prisma.publisherCatalogSong.count();

  return (
    <div className="p-6 sm:p-8 min-h-screen bg-blue-600">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BookOpen className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">Publisher Catalog</h1>
            </div>
            <p className="text-blue-200 mt-1">Kelola katalog lagu dari berbagai publisher</p>
          </div>
        </div>

        <div className="bg-blue-700/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-blue-500/30 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-blue-200 font-medium">Total Lagu Terdaftar</p>
            <p className="text-3xl font-black text-white">{total.toLocaleString("id-ID")} <span className="text-lg text-blue-300 font-medium">Lagu</span></p>
          </div>
        </div>

        <PublisherCatalogAdminClient />
      </div>
    </div>
  );
}
