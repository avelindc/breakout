"use client";

import { useState } from "react";
import { CatalogHalo } from "@prisma/client";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, ExternalLink, RefreshCw, X, Upload } from "lucide-react";
import { addCatalogHalo, updateCatalogHalo, deleteCatalogHalo } from "@/app/actions/catalogHalo";

export function CatalogHaloAdminClient({ initialData }: { initialData: CatalogHalo[] }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogHalo | null>(null);
  const [formData, setFormData] = useState({ songId: "", title: "", composer: "", publisher: "", performer: "", youtubeUrl: "", coverUrl: "" });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filtered = data.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    item.performer.toLowerCase().includes(search.toLowerCase()) ||
    item.composer.toLowerCase().includes(search.toLowerCase()) ||
    (item.songId && item.songId.toLowerCase().includes(search.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenModal = (item?: CatalogHalo) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        songId: item.songId || "",
        title: item.title,
        composer: item.composer,
        publisher: item.publisher || "",
        performer: item.performer,
        youtubeUrl: item.youtubeUrl || "",
        coverUrl: item.coverUrl || "",
      });
    } else {
      setEditingItem(null);
      setFormData({ songId: "", title: "", composer: "", publisher: "", performer: "", youtubeUrl: "", coverUrl: "" });
    }
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalCoverUrl = formData.coverUrl;
      
      if (coverFile) {
        const form = new FormData();
        form.append('file', coverFile);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (res.ok) {
          const result = await res.json();
          finalCoverUrl = result.url;
        }
      }

      const payload = {
        songId: formData.songId || null,
        title: formData.title,
        composer: formData.composer,
        publisher: formData.publisher || null,
        performer: formData.performer,
        youtubeUrl: formData.youtubeUrl || null,
        coverUrl: finalCoverUrl || null,
      };

      if (editingItem) {
        const updated = await updateCatalogHalo(editingItem.id, payload);
        setData(prev => prev.map(d => d.id === updated.id ? updated : d));
      } else {
        const added = await addCatalogHalo(payload);
        setData([added, ...data]);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Error saving data");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this catalog item?")) return;
    try {
      await deleteCatalogHalo(id);
      setData(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      alert("Error deleting item");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Katalog Halo</h1>
          <p className="text-gray-500 mt-1">Manage Halo catalog ({data.length}+ entries)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" /> Add Entry
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by title, performer, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Cover</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Song ID</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Title</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Performer</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Composer</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Links</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt="Cover" className="w-10 h-10 rounded object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border border-gray-200">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-gray-500">{item.songId || '-'}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{item.title}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.performer}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.composer}</td>
                  <td className="py-3 px-4">
                    {item.youtubeUrl ? (
                      <a href={item.youtubeUrl} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 text-xs bg-red-50 px-2 py-1 rounded w-max">
                        <ExternalLink className="w-3.5 h-3.5" /> YouTube
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-400 hover:text-blue-600 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              No entries found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-100">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-200"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-gray-600">Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-200"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingItem ? "Edit Entry" : "Add Entry"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Song ID</label>
                    <input type="text" value={formData.songId} onChange={e => setFormData({...formData, songId: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Publisher</label>
                    <input type="text" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Performer</label>
                  <input required type="text" value={formData.performer} onChange={e => setFormData({...formData, performer: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Composer</label>
                  <input type="text" value={formData.composer} onChange={e => setFormData({...formData, composer: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">YouTube URL</label>
                  <input type="url" value={formData.youtubeUrl} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="https://www.youtube.com/watch?v=..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cover Image</label>
                  <div className="flex items-center gap-4">
                    {formData.coverUrl && !coverFile && (
                      <img src={formData.coverUrl} alt="Cover" className="w-16 h-16 rounded object-cover shadow border border-gray-200" />
                    )}
                    {coverFile && (
                      <div className="w-16 h-16 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-600 text-center p-2 break-all overflow-hidden">
                        New
                      </div>
                    )}
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Upload Photo
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setCoverFile(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50">
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingItem ? "Save Changes" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
