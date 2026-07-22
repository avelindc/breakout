import { PublisherCatalogUserClient } from "./PublisherCatalogUserClient";
import { BookOpen } from "lucide-react";

export default function UserPublisherCatalogPage() {
  return (
    <div className="animate-fade-in w-full pb-10 px-4 md:px-0">
      <div className="mb-6 md:mb-8 bg-white/60 backdrop-blur-xl border border-white shadow-md rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-200">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Publisher Catalog</h1>
          </div>
          <p className="text-gray-500 font-medium">Jelajahi katalog lagu dari berbagai publisher yang kami kelola.</p>
        </div>
      </div>
      <PublisherCatalogUserClient />
    </div>
  );
}
