import { CatalogClient } from "@/components/CatalogClient";

export default function UserCatalogPage() {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Katalog Musik</h1>
        <p className="text-gray-400">Jelajahi dan ajukan rilis ulang (cover) dari katalog musik global kami.</p>
      </div>

      <CatalogClient />
    </div>
  );
}
