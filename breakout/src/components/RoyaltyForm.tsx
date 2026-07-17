"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { addRoyaltyAction } from "@/app/actions/royalties";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full py-3 mt-4 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
      {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} 
      {pending ? "Saving Data..." : "Save Royalty Data"}
    </button>
  );
}

export function RoyaltyForm({ artists }: { artists: any[] }) {
  const [selectedArtistId, setSelectedArtistId] = useState("");
  
  const selectedArtist = artists.find(a => a.id === selectedArtistId);
  const availableSongs = selectedArtist?.releases || [];

  return (
    <form action={async (formData) => { await addRoyaltyAction(formData); }} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Artist *</label>
        <select 
          required 
          name="artistId" 
          value={selectedArtistId}
          onChange={(e) => setSelectedArtistId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition"
        >
          <option value="">Select Artist</option>
          {artists.map(artist => {
            const primaryArtistName = artist.releases.length > 0 ? artist.releases[0].primaryArtist : artist.stageName;
            return (
              <option key={artist.id} value={artist.id}>
                {primaryArtistName}
              </option>
            );
          })}
        </select>
      </div>


      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Month (1-12) *</label>
          <input required name="month" type="number" min="1" max="12" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Year *</label>
          <input required name="year" type="number" min="2020" max="2100" defaultValue={new Date().getFullYear()} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition" />
        </div>
      </div>

      <div className="space-y-1 pt-2">
        <label className="text-sm font-bold text-gray-900">Total Revenue (IDR) *</label>
        <input required name="totalRevenue" type="number" step="1" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition font-bold" placeholder="0" />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Stream Counts (Optional)</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-xs text-gray-500">Spotify</label>
            <input name="spotifyStreams" type="number" defaultValue={0} className="w-full border border-gray-200 rounded px-2 py-1 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Apple Music</label>
            <input name="appleMusicStreams" type="number" defaultValue={0} className="w-full border border-gray-200 rounded px-2 py-1 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">YouTube</label>
            <input name="youtubeStreams" type="number" defaultValue={0} className="w-full border border-gray-200 rounded px-2 py-1 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">TikTok</label>
            <input name="tiktokStreams" type="number" defaultValue={0} className="w-full border border-gray-200 rounded px-2 py-1 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Amazon</label>
            <input name="amazonStreams" type="number" defaultValue={0} className="w-full border border-gray-200 rounded px-2 py-1 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Other</label>
            <input name="otherStreams" type="number" defaultValue={0} className="w-full border border-gray-200 rounded px-2 py-1 outline-none" />
          </div>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
