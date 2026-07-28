import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { R2GateClient } from "./R2GateClient";

export default async function R2GatePage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-8 bg-gradient-to-r from-orange-500 to-red-600 p-8 md:p-10 rounded-3xl shadow-lg border border-red-400 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Gerbang R2</h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
            Pusat kendali migrasi penyimpanan. Gunakan fitur ini untuk memindahkan semua file dari penyimpanan sementara (Supabase) menuju penyimpanan abadi tanpa batas (Cloudflare R2).
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shrink-0">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Status Egress</p>
          <div className="text-2xl font-bold">Cloudflare R2 (Free)</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-10">
        <R2GateClient />
      </div>
    </div>
  );
}
