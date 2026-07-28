"use client";

import { useState } from "react";
import { Search, Loader2, CloudLightning, CheckCircle2, AlertTriangle } from "lucide-react";

interface MigratableFile {
  table: string;
  id: string;
  column: string;
  url: string;
  name: string;
}

export function R2GateClient() {
  const [files, setFiles] = useState<MigratableFile[]>([]);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const [migrating, setMigrating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [failed, setFailed] = useState<number[]>([]);

  const handleScan = async () => {
    setScanning(true);
    setScanned(false);
    setFiles([]);
    try {
      const res = await fetch("/api/admin/r2-gate/scan");
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        setScanned(true);
      } else {
        alert("Gagal melakukan scan: " + data.error);
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan saat scan.");
    } finally {
      setScanning(false);
    }
  };

  const handleMigrate = async () => {
    if (files.length === 0) return;
    setMigrating(true);
    setCurrentIndex(0);
    setCompleted([]);
    setFailed([]);

    const currentCompleted: number[] = [];
    const currentFailed: number[] = [];

    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i);
      const file = files[i];
      try {
        const res = await fetch("/api/admin/r2-gate/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(file),
        });
        const data = await res.json();
        
        if (data.success || data.error?.includes("not found in Supabase")) {
          // If not found in Supabase but DB says it is, it's technically handled or dead link, treat as success/skip
          currentCompleted.push(i);
          setCompleted([...currentCompleted]);
        } else {
          currentFailed.push(i);
          setFailed([...currentFailed]);
        }
      } catch (err) {
        currentFailed.push(i);
        setFailed([...currentFailed]);
      }
    }

    setMigrating(false);
    setCurrentIndex(files.length);
    alert("Proses Gerbang R2 Selesai!");
  };

  return (
    <div className="space-y-8">
      {/* Action Area */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center p-8 bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
        <button
          onClick={handleScan}
          disabled={scanning || migrating}
          className="px-6 py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition shadow-sm flex items-center gap-3 disabled:opacity-50"
        >
          {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 text-gray-400" />}
          {scanning ? "Memindai Server..." : "1. Scan File Supabase"}
        </button>

        <div className="w-10 h-1 bg-gray-200 hidden md:block rounded-full" />

        <button
          onClick={handleMigrate}
          disabled={!scanned || migrating || files.length === 0}
          className="px-8 py-4 rounded-2xl bg-orange-600 text-white font-extrabold hover:bg-orange-700 transition shadow-lg shadow-orange-500/30 flex items-center gap-3 disabled:opacity-50 disabled:shadow-none"
        >
          {migrating ? <Loader2 className="w-6 h-6 animate-spin" /> : <CloudLightning className="w-6 h-6" />}
          {migrating ? "Sedang Menyedot..." : "2. BUKA GERBANG R2"}
        </button>
      </div>

      {/* Results Area */}
      {scanned && !migrating && currentIndex === 0 && (
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 mb-4">
            <span className="text-4xl font-black text-blue-600">{files.length}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">File Menunggu Migrasi</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {files.length > 0 
              ? "Sistem menemukan file yang masih tertahan di Supabase. Tekan Buka Gerbang R2 untuk memindahkan semuanya secara estafet." 
              : "Gudang Supabase sudah bersih! Semua file saat ini berada di Cloudflare R2."}
          </p>
        </div>
      )}

      {/* Progress Area */}
      {(migrating || currentIndex > 0) && (
        <div className="bg-gray-900 rounded-3xl p-6 md:p-8 text-white animate-fade-in shadow-2xl">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold text-xl mb-1">Status Migrasi</h3>
              <p className="text-gray-400 text-sm">
                Selesai: <span className="text-green-400 font-bold">{completed.length}</span> | 
                Gagal: <span className="text-red-400 font-bold">{failed.length}</span> | 
                Total: <span className="text-white font-bold">{files.length}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-orange-400">
                {Math.round((completed.length + failed.length) / Math.max(files.length, 1) * 100)}%
              </span>
            </div>
          </div>
          
          <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-6 border border-gray-700">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${(completed.length + failed.length) / Math.max(files.length, 1) * 100}%` }}
            />
          </div>

          <div className="h-64 overflow-y-auto bg-black/40 rounded-2xl p-4 border border-white/5 space-y-2 font-mono text-xs">
            {files.map((file, idx) => {
              let statusText = "Menunggu...";
              let statusColor = "text-gray-500";
              
              if (idx === currentIndex && migrating) {
                statusText = "Processing...";
                statusColor = "text-yellow-400 animate-pulse";
              } else if (completed.includes(idx)) {
                statusText = "OK";
                statusColor = "text-green-400";
              } else if (failed.includes(idx)) {
                statusText = "FAILED";
                statusColor = "text-red-400";
              }

              // Show items around the current index, or all if finished
              if (!migrating || Math.abs(idx - currentIndex) < 10) {
                return (
                  <div key={idx} className="flex justify-between items-center border-b border-white/5 py-1.5">
                    <span className="text-gray-300 truncate pr-4">[{file.table}] {file.name}</span>
                    <span className={`font-bold shrink-0 ${statusColor}`}>{statusText}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
