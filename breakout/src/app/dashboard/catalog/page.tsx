import { CatalogClient } from "@/components/CatalogClient";

export default function UserCatalogPage() {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-6 md:mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Katalog Musik</h1>
        <p className="text-gray-500 font-medium">Jelajahi dan ajukan rilis ulang (cover) dari katalog musik global kami.</p>
      </div>

      <CatalogClient />
    </div>
  );
}
