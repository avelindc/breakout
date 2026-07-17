"use client";

import { useState } from "react";
import { uploadBrandLogoAction } from "@/app/actions/settings";
import { Upload } from "lucide-react";

export function BrandSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

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
    const res = await uploadBrandLogoAction(formData);

    if (res.error) {
      setMessage(`❌ ${res.error}`);
    } else {
      setMessage("✅ Brand logo updated successfully!");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Brand Settings</h2>
      <p className="text-gray-500 text-sm mb-6">Upload a global logo that will be seen by all users on the platform.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform Logo</label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input 
                type="file" 
                name="logo" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                required
              />
              <p className="text-xs text-gray-500 mt-2">PNG, JPG or WEBP. Max 2MB. Transparent background recommended.</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Save Brand Logo"}
        </button>
      </form>
    </div>
  );
}
