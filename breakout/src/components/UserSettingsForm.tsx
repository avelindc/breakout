"use client";

import { useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { Upload } from "lucide-react";

export function UserSettingsForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(user.image || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const res = await updateProfileAction(formData);

    if (res.error) {
      setMessage(`❌ ${res.error}`);
    } else {
      setMessage("✅ Profile updated successfully!");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Profile Photo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer pointer-events-none">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <input 
              type="file" 
              name="photo" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-xs text-gray-400">Click to change</span>
        </div>

        {/* User Details */}
        <div className="flex-1 space-y-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input type="email" name="email" defaultValue={user.email || ""} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00F0FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input type="text" name="name" defaultValue={user.name || ""} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] text-white transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp Number</label>
              <input type="text" name="whatsapp" defaultValue={user.whatsapp || ""} placeholder="e.g. 62812345678" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] text-white transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <input type="password" name="password" placeholder="Leave blank to keep current password" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] text-white transition" />
            </div>
          </div>
        </div>
      </div>
      
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.startsWith("✅") ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
          {message}
        </div>
      )}

      <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7000FF] to-[#0047FF] text-white font-bold hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
