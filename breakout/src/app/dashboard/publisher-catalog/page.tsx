import { PublisherCatalogUserClient } from "./PublisherCatalogUserClient";
import { BookOpen } from "lucide-react";

export default function UserPublisherCatalogPage() {
  return (
    <div className="animate-fade-in min-h-screen bg-blue-600 -m-8 p-8">
      <div className="max-w-7xl mx-auto pb-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Publisher Catalog</h1>
          </div>
          <p className="text-blue-200">Jelajahi katalog lagu dari berbagai publisher yang kami kelola.</p>
        </div>
        <PublisherCatalogUserClient />
      </div>
    </div>
  );
}
