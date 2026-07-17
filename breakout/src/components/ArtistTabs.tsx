"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ArtistTabs({ artists }: { artists: any[] }) {
  const searchParams = useSearchParams();
  const currentArtistId = searchParams.get("artistId");

  if (!artists || artists.length === 0) return null;

  return (
    <div className="border-b border-gray-200 mb-6 flex gap-8 overflow-x-auto scrollbar-hide">
      <Link 
        href="/admin/artists" 
        className={`whitespace-nowrap pb-3 text-sm font-semibold border-b-2 transition ${
          !currentArtistId 
            ? "border-blue-600 text-blue-600" 
            : "border-transparent text-gray-400 hover:text-gray-900"
        }`}
      >
        All Artists
      </Link>
      
      {artists.map((artist) => {
        const isActive = currentArtistId === artist.id;
        return (
          <Link 
            key={artist.id}
            href={`/admin/artists?artistId=${artist.id}`} 
            className={`whitespace-nowrap pb-3 text-sm font-semibold border-b-2 transition ${
              isActive 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-gray-400 hover:text-gray-900"
            }`}
          >
            {artist.stageName}
          </Link>
        );
      })}
    </div>
  );
}
