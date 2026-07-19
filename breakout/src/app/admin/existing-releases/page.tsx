import { PrismaClient } from "@prisma/client";
import { Plus, Music, ExternalLink, Disc } from "lucide-react";
import Link from "next/link";
import { ImportReleaseForm } from "./ImportReleaseForm";
import DeleteExistingReleaseButton from "./DeleteExistingReleaseButton";

const prisma = new PrismaClient();

export const metadata = {
  title: "Existing Release | Admin BREAKOUT.ID",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    RELEASED: { label: "Released", color: "bg-green-100 text-green-700" },
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
  };
  const s = map[status] || { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {s.label}
    </span>
  );
}

export default async function ExistingReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const params = await searchParams;
  const showForm = params?.action === "import";

  const releases = await prisma.release.findMany({
    where: { isImported: true },
    include: { artist: { include: { user: true } }, tracks: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f000ff] to-[#8a2be2] flex items-center justify-center shadow-lg">
                <Disc className="w-5 h-5 text-white" />
              </div>
              Existing Release
            </h1>
            <p className="text-gray-500 text-sm">
              Catalog yang sudah pernah dirilis sebelum menggunakan BREAKOUT.ID.
              <span className="ml-2 font-semibold text-gray-700">{releases.length} release diimport</span>
            </p>
          </div>
          {!showForm && (
            <Link
              href="/admin/existing-releases?action=import"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#f000ff] to-[#8a2be2] text-white font-bold rounded-2xl hover:opacity-90 transition shadow-lg shadow-purple-500/20 shrink-0"
            >
              <Plus className="w-5 h-5" />
              Import Catalog Baru
            </Link>
          )}
          {showForm && (
            <Link
              href="/admin/existing-releases"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition shrink-0"
            >
              ← Kembali ke Daftar
            </Link>
          )}
        </div>
      </div>

      {/* Import Form */}
      {showForm ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Import Release Baru</h2>
            <p className="text-gray-500 text-sm">
              Isi data release yang sudah pernah dirilis. Status akan otomatis <strong>RELEASED</strong>.
            </p>
          </div>
          <ImportReleaseForm />
        </div>
      ) : (
        /* Release List */
        <div className="space-y-4">
          {releases.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f000ff]/10 to-[#8a2be2]/10 flex items-center justify-center mb-5">
                <Music className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Release yang Diimport</h2>
              <p className="text-gray-500 mb-6 max-w-md text-sm">
                Gunakan fitur Import Catalog untuk memasukkan lagu lama, katalog Believe, Revelator, atau lainnya.
              </p>
              <Link
                href="/admin/existing-releases?action=import"
                className="px-8 py-3 bg-gradient-to-r from-[#f000ff] to-[#8a2be2] text-white font-bold rounded-2xl hover:opacity-90 transition shadow-lg"
              >
                Import Catalog Pertama
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header (Desktop) */}
              <div className="hidden md:flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="w-16 shrink-0">Cover</div>
                <div className="flex-1 min-w-0 px-4">Release Info</div>
                <div className="w-28 shrink-0">Distributor</div>
                <div className="w-32 shrink-0">UPC / ISRC</div>
                <div className="w-28 shrink-0">Tanggal</div>
                <div className="w-24 shrink-0">Status</div>
                <div className="w-24 shrink-0 text-right">Links</div>
              </div>

              {releases.map((release) => (
                <div
                  key={release.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 p-5 md:px-6 md:py-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-purple-200 hover:shadow-md transition group"
                >
                  {/* Cover */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={release.coverArtworkUrl}
                      alt={release.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 px-0 md:px-4">
                    <p className="font-bold text-gray-900 truncate">{release.title}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {release.primaryArtist} • {release.genre} • {release.type}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{release.artist.user.email}</p>
                  </div>

                  {/* Distributor */}
                  <div className="hidden md:block w-28 shrink-0">
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                      {release.distributor || "—"}
                    </span>
                  </div>

                  {/* UPC / ISRC */}
                  <div className="hidden md:block w-32 shrink-0 text-xs font-mono text-gray-500">
                    <div>UPC: {release.upc || "—"}</div>
                    <div>ISRC: {release.tracks[0]?.isrc || "—"}</div>
                  </div>

                  {/* Date */}
                  <div className="hidden md:block w-28 shrink-0 text-sm text-gray-500">
                    {new Date(release.releaseDate).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  {/* Status */}
                  <div className="w-24 shrink-0">
                    <StatusBadge status={release.status} />
                  </div>

                  {/* Platform Links */}
                  <div className="flex items-center gap-2 w-24 shrink-0 justify-end">
                    {release.spotifyUrl && (
                      <a
                        href={release.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-green-500 transition"
                        title="Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {release.appleMusicUrl && (
                      <a
                        href={release.appleMusicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-pink-500 transition"
                        title="Apple Music"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {!release.spotifyUrl && !release.appleMusicUrl && (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                    <DeleteExistingReleaseButton releaseId={release.id} releaseTitle={release.title} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
