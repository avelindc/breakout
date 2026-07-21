"use client";

import { Download } from "lucide-react";

export function DownloadCsvButton({ data }: { data: any[] }) {
  const downloadCSV = () => {
    const headers = ["Period", "Artist", "Track", "Spotify", "Apple Music", "YouTube", "TikTok", "Facebook", "Instagram", "Amazon", "Other", "Cut (%)", "Net Revenue (IDR)"];
    
    const rows = data.map(r => {
      const period = new Date(r.year, r.month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const pData = (r.platformData as any) || {};
      const cut = pData.cutPercentage || 0;
      return [
        period,
        `"${(r.artist?.stageName || "").replace(/"/g, '""')}"`,
        `"${(r.songName || "").replace(/"/g, '""')}"`,
        r.spotifyStreams || 0,
        r.appleMusicStreams || 0,
        r.youtubeStreams || 0,
        r.tiktokStreams || 0,
        pData.facebook || 0,
        pData.instagram || 0,
        r.amazonStreams || 0,
        r.otherStreams || 0,
        cut,
        Math.round(r.totalRevenue || 0)
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "global_royalties.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={downloadCSV} className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm transition-all hover:border-purple-200 hover:shadow-md">
      <Download className="w-4 h-4 text-purple-600" />
      Export CSV
    </button>
  );
}
