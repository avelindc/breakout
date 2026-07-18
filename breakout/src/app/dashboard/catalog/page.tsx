import { CatalogClient } from "@/components/CatalogClient";

export default function UserCatalogPage() {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-6 md:mb-8 bg-gradient-to-br from-[#f000ff] to-[#8a2be2] text-white rounded-[2rem] p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgba(240,0,255,0.25)]">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Katalog Musik</h1>
        <p className="text-white/80 font-medium">Jelajahi dan ajukan rilis ulang (cover) dari katalog musik global kami.</p>
      </div>

      <CatalogClient />
    </div>
  );
}
