"use client";

import { useState, useEffect } from "react";
import { Search, PlayCircle, Music, Mic2, FileAudio } from "lucide-react";

interface DamarlangitSong {
  index: number;
  judul_lagu: string;
  performer: string;
  composer: string;
  link: string;
}

export function CatalogDamarlangitClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<DamarlangitSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 24;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const start = (currentPage - 1) * itemsPerPage;
        const res = await fetch(`/api/damarlangit?start=${start}&length=${itemsPerPage}&search=${encodeURIComponent(debouncedSearch)}`);
        const result = await res.json();
        if (result.data) {
          setData(result.data);
          setTotalRecords(result.recordsFiltered || result.recordsTotal || 0);
        }
      } catch (error) {
        console.error("Failed to fetch Damarlangit catalog", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, debouncedSearch]);

  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  const formatYoutubeUrl = (url: string) => {
    if (!url || url.length < 15 || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return null;
    }
    return url;
  };

  return (
    <div className="animate-fade-in w-full pb-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <FileAudio className="w-8 h-8 text-purple-600" /> Katalog Damarlangit
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Jelajahi daftar lagu lengkap dari Damarlangit.</p>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari judul, penyanyi, atau pencipta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition font-medium"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden flex flex-col group">
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 border-b border-gray-100">
                  <Music className="w-12 h-12 text-purple-200 mb-2" />
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">NO COVER</span>
                  {formatYoutubeUrl(item.link) && (
                    <a 
                      href={formatYoutubeUrl(item.link)!} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute bottom-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-lg transition transform hover:scale-110 z-10 flex items-center justify-center"
                      title="Watch on YouTube"
                    >
                      <PlayCircle className="w-5 h-5" />
                    </a>
                  )}
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-3 line-clamp-2" title={item.judul_lagu}>
                    {item.judul_lagu}
                  </h3>
                  
                  <div className="mt-auto space-y-2">
                    <div className="flex items-start gap-2">
                      <Mic2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Penyanyi</p>
                        <p className="text-sm font-medium text-gray-700 line-clamp-1" title={item.performer}>{item.performer || "-"}</p>
                      </div>
                    </div>
                    
                    {item.composer && (
                      <div className="flex items-start gap-2 pt-2 border-t border-gray-50">
                        <Music className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pencipta</p>
                          <p className="text-sm font-medium text-gray-700 line-clamp-1" title={item.composer}>{item.composer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {data.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <FileAudio className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Tidak ada data ditemukan</h3>
              <p className="text-gray-500">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">Page {currentPage} of {totalPages}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
