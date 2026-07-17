"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Artist = {
  id: string;
  userId: string;
  stageName: string;
  avatarUrl: string | null;
  createdAt: Date;
  releases: any[];
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
};

export function AllArtistsClient({ artists }: { artists: Artist[] }) {
  const router = useRouter();
  const [slidingId, setSlidingId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleClick = (artist: Artist) => {
    if (slidingId) return; // prevent double click
    setSlidingId(artist.id);
    setIsExiting(true);
    // After slide-out animation (350ms), navigate
    setTimeout(() => {
      router.push(`/admin/artists/${artist.userId}`);
    }, 350);
  };

  return (
    <div
      className={`min-w-[900px] space-y-3 transition-all duration-350 ease-in-out ${
        isExiting ? "opacity-0 translate-x-[-40px]" : "opacity-100 translate-x-0"
      }`}
      style={{ transition: "opacity 350ms cubic-bezier(0.4,0,0.2,1), transform 350ms cubic-bezier(0.4,0,0.2,1)" }}
    >
      {/* Table Header */}
      <div className="flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
        <div className="w-20">ID</div>
        <div className="flex-1">Stage Name</div>
        <div className="flex-1">Managed By (User)</div>
        <div className="w-32 text-center">Releases</div>
        <div className="w-40">Created At</div>
      </div>

      {artists.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No artists found.
        </div>
      )}

      {/* Artist Rows */}
      {artists.map((artist, i) => (
        <div
          key={artist.id}
          onClick={() => handleClick(artist)}
          className="flex items-center px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer group"
          style={{
            transition: `transform 350ms cubic-bezier(0.4,0,0.2,1) ${i * 30}ms, opacity 350ms cubic-bezier(0.4,0,0.2,1) ${i * 30}ms, box-shadow 200ms ease, background-color 200ms ease`,
            transform: isExiting ? "translateX(-60px) scale(0.97)" : "translateX(0) scale(1)",
            opacity: isExiting ? 0 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isExiting) {
              (e.currentTarget as HTMLElement).style.transform = "translateX(6px) scale(1.01)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(59,130,246,0.12)";
              (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f7ff";
            }
          }}
          onMouseLeave={(e) => {
            if (!isExiting) {
              (e.currentTarget as HTMLElement).style.transform = "translateX(0) scale(1)";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
            }
          }}
        >
          <div className="w-20 text-gray-500 font-medium text-sm">
            #{artist.id.slice(-4).toUpperCase()}
          </div>

          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 w-max">
              {artist.avatarUrl || artist.user.image ? (
                <img
                  src={artist.avatarUrl || artist.user.image!}
                  alt={artist.stageName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.stageName}`}
                  alt={artist.stageName}
                  className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0"
                />
              )}
              <span className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {artist.stageName}
              </span>
            </div>
          </div>

          <div className="flex-1 text-gray-500 text-sm pr-4 truncate flex flex-col">
            <span className="font-medium text-gray-700">{artist.user.name || "Unknown"}</span>
            <span className="text-xs">{artist.user.email}</span>
          </div>

          <div className="w-32 text-center font-semibold text-gray-900">
            {artist.releases.length}
          </div>

          <div className="w-40 text-gray-500 text-sm flex items-center justify-between">
            <span>{new Date(artist.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
            {/* Arrow indicator */}
            <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
