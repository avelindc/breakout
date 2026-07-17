"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/app/actions/messages";
import { Upload, Paperclip, X } from "lucide-react";

export function MessageComposeForm({ users }: { users: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("broadcast", isBroadcast.toString());
    
    // Append the file manually because the input element is unmounted when a file is selected
    if (file) {
      formData.set("attachment", file);
    }

    const res = await sendMessageAction(formData);

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin/messages");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recipients */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900">Recipients</h3>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="recipientType" 
              checked={isBroadcast} 
              onChange={() => setIsBroadcast(true)}
              className="text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">All Artists (Broadcast)</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="recipientType" 
              checked={!isBroadcast} 
              onChange={() => setIsBroadcast(false)}
              className="text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Specific Artists</span>
          </label>
        </div>

        {!isBroadcast && (
          <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
            {users.map(user => (
              <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                <input type="checkbox" name="recipients" value={user.id} className="text-blue-600 rounded" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input 
            type="text" 
            name="subject"
            required
            placeholder="e.g. Important Update regarding Royalties"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea 
            name="body"
            required
            rows={8}
            placeholder="Write your message here..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (Optional)</label>
          
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
              <input 
                type="file" 
                name="attachment"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <Upload className="w-8 h-8 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700">Click or drag file to upload</p>
                <p className="text-xs text-gray-500 mt-1">PDF, Excel, Word, ZIP, or Image (Max 5MB)</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setFile(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button 
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button 
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}
