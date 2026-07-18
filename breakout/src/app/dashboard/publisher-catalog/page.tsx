import { PublisherCatalogUserClient } from "./PublisherCatalogUserClient";
import { BookOpen } from "lucide-react";

export default function UserPublisherCatalogPage() {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-6 md:mb-8 bg-gradient-to-br from-[#f000ff] to-[#8a2be2] text-white rounded-[2rem] p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgba(240,0,255,0.25)] md:bg-white md:bg-none md:text-gray-900 md:border-gray-100 md:shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 md:bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white md:text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white md:text-gray-900">Publisher Catalog</h1>
          </div>
          <p className="text-white/80 md:text-gray-500 font-medium">Jelajahi katalog lagu dari berbagai publisher yang kami kelola.</p>
        </div>
      </div>
      <PublisherCatalogUserClient />
    </div>
  );
}
