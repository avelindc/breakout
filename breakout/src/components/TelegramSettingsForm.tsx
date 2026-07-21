"use client";

import { useState } from "react";
import { saveTelegramSettingsAction, testTelegramConnectionAction } from "@/app/actions/telegram";
import { Loader2, Send } from "lucide-react";

export function TelegramSettingsForm({ initialData }: { initialData: { enabled: boolean, botToken: string, chatId: string } }) {
  const [enabled, setEnabled] = useState(initialData?.enabled || false);
  const [botToken, setBotToken] = useState(initialData?.botToken || "");
  const [chatId, setChatId] = useState(initialData?.chatId || "");
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const origin = window.location.origin;

    try {
      const res = await saveTelegramSettingsAction(enabled, botToken, chatId, origin);
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({ type: 'success', text: "Pengaturan Telegram berhasil disimpan!" });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await testTelegramConnectionAction(botToken, chatId);
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({ type: 'success', text: "Pesan percobaan berhasil dikirim ke Telegram!" });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Telegram Bot Integration</h2>
          <p className="text-sm text-gray-500">
            Dapatkan notifikasi real-time saat user mengirim rilisan baru.
          </p>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {enabled ? "Aktif" : "Nonaktif"}
            </span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telegram Bot Token</label>
          <input 
            type="text" 
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            disabled={!enabled}
            placeholder="e.g. 123456789:ABCdefGHIjklmNOPqrsTUVwxyz..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400" 
          />
          <p className="text-xs text-gray-500 mt-1">Dapatkan token dengan membuat bot melalui @BotFather di Telegram.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telegram Chat ID</label>
          <input 
            type="text" 
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            disabled={!enabled}
            placeholder="e.g. -1001234567890 (untuk grup) atau 123456789 (untuk personal)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400" 
          />
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-4">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center min-w-[140px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Settings"}
          </button>
          
          <button 
            type="button" 
            onClick={handleTestConnection}
            disabled={testing || !enabled || !botToken || !chatId}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
            Test Connection
          </button>
        </div>
      </form>
    </div>
  );
}
