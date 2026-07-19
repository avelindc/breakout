"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, RefreshCw, Database } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { processImportStreamingBatch, deleteImportLog, ParsedRow } from "@/app/actions/importStreaming";
import { useRouter } from "next/navigation";

export default function ImportStreamingClient({ initialLogs }: { initialLogs: any[] }) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expected standard columns
  const standardColumns = [
    { key: "isrc", label: "ISRC (Wajib)" },
    { key: "upc", label: "UPC" },
    { key: "title", label: "Judul Lagu" },
    { key: "artist", label: "Artis" },
    { key: "streams", label: "Streams" },
    { key: "revenue", label: "Revenue" },
    { key: "platform", label: "Platform" },
    { key: "country", label: "Country" },
    { key: "date", label: "Date (YYYY-MM)" }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    try {
      let json: any[][] = [];
      let fileHeaders: string[] = [];
      let rawData: any[] = [];

      if (f.name.toLowerCase().endsWith(".csv")) {
        let text = await f.text();
        
        // Remove Byte Order Mark (BOM) if present
        text = text.replace(/^\uFEFF/, '');
        
        // Unwrap lines if the entire CSV row is enclosed in double quotes (common in Believe CSV exports)
        let lines = text.split('\n');
        if (lines.length > 0 && lines[0].trim().startsWith('"') && lines[0].trim().endsWith('"') && lines[0].includes(';')) {
            text = lines.map(line => {
                let l = line.trim();
                if (l.startsWith('"') && l.endsWith('"')) {
                    // Remove starting and ending quotes and unescape double-quotes
                    return l.substring(1, l.length - 1).replace(/""/g, '"');
                }
                return line;
            }).join('\n');
        }

        // Use papaparse for CSV to auto-detect delimiter (; or ,)
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        
        if (result.data && result.data.length > 0) {
          fileHeaders = result.meta.fields || [];
          rawData = result.data;
          // Papa.parse returns array of objects when header: true
          // We can just use the keys of the first object if meta.fields is missing
          if (fileHeaders.length === 0) {
            fileHeaders = Object.keys(result.data[0] as object);
          }
        }
      } else {
        const data = await f.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (json.length > 0) {
          fileHeaders = (json[0] || []).map((h: any) => String(h || "").trim());
          rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
        }
      }
      
      if (fileHeaders.length > 0) {
        setHeaders(fileHeaders);
        
        // Auto map headers
        const newMapping: Record<string, string> = {};
        fileHeaders.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes("isrc")) newMapping["isrc"] = h;
          else if (lower.includes("upc") || lower.includes("barcode")) newMapping["upc"] = h;
          else if (lower.includes("title") || lower.includes("track")) newMapping["title"] = h;
          else if (lower.includes("artist")) newMapping["artist"] = h;
          else if (lower.includes("stream") || lower.includes("quantity") || lower.includes("count")) newMapping["streams"] = h;
          else if (lower.includes("revenue") || lower.includes("earning") || lower.includes("net") || lower.includes("amount")) newMapping["revenue"] = h;
          else if (lower.includes("platform") || lower.includes("store") || lower.includes("service")) newMapping["platform"] = h;
          else if (lower.includes("country") || lower.includes("territory")) newMapping["country"] = h;
          else if (lower.includes("date") || lower.includes("period")) newMapping["date"] = h;
        });
        setMapping(newMapping);
        
        // Preview top 5 rows
        setPreviewData(rawData);
      }
    } catch (err) {
      alert("Gagal membaca file CSV. Pastikan formatnya benar.");
    }
    setParsing(false);
  };

  const executeImport = async () => {
    if (!file || previewData.length === 0) return;
    setImporting(true);

    const parsedRows: ParsedRow[] = previewData.map(row => {
      return {
        isrc: row[mapping["isrc"]]?.toString(),
        upc: row[mapping["upc"]]?.toString(),
        title: row[mapping["title"]]?.toString(),
        artist: row[mapping["artist"]]?.toString(),
        streams: parseFloat(row[mapping["streams"]] || 0) || 0,
        revenue: parseFloat(row[mapping["revenue"]] || 0) || 0,
        platform: row[mapping["platform"]]?.toString(),
        country: row[mapping["country"]]?.toString(),
        date: row[mapping["date"]]?.toString(),
      };
    });

    const res = await processImportStreamingBatch(file.name, parsedRows);
    if (res.success) {
      alert("Import berhasil! Data telah disinkronkan.");
      setFile(null);
      setPreviewData([]);
      // Prepend to logs
      setLogs([res.log, ...logs]);
      router.refresh();
    } else {
      alert("Gagal melakukan import: " + res.error);
    }
    setImporting(false);
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm("Hapus riwayat import ini? Data streaming yang sudah masuk TIDAK akan terhapus, hanya menghapus log ini saja.")) {
      await deleteImportLog(id);
      setLogs(logs.filter(l => l.id !== id));
      router.refresh();
    }
  };

  return (
    <div className="animate-fade-in font-sans pb-16 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" /> Import Streaming Data
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Upload file CSV laporan streaming dari distributor (Believe, TuneCore, dll). Sistem akan otomatis mencocokkan ISRC dan mensinkronkan Analytics Admin & User tanpa mengubah data master.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* UPLOAD AREA */}
          <div 
            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all bg-white shadow-sm ${isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-gray-200 hover:border-blue-300"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
          >
            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              {parsing ? <RefreshCw className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{file ? file.name : "Drag & Drop File CSV"}</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm mt-1">
              {file ? "File siap di-import. Cek pemetaan kolom di bawah." : "Atau klik tombol di bawah untuk mencari file di komputer Anda. Mendukung CSV dan Excel."}
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Browse File
            </button>
          </div>

          {/* COLUMN MAPPING & PREVIEW */}
          {file && previewData.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" /> Pemetaan Kolom Otomatis
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {standardColumns.map(col => (
                  <div key={col.key} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{col.label}</p>
                    <select 
                      value={mapping[col.key] || ""}
                      onChange={(e) => setMapping({...mapping, [col.key]: e.target.value})}
                      className="w-full bg-white border border-gray-200 text-xs rounded-lg p-1.5 focus:border-blue-500 outline-none"
                    >
                      <option value="">-- Abaikan --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900">Preview Data (5 Baris Pertama)</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-mono">{previewData.length} Baris Total</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      {standardColumns.map(c => <th key={c.key} className="px-4 py-2 font-semibold">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {standardColumns.map(c => (
                          <td key={c.key} className="px-4 py-2 text-gray-700">{row[mapping[c.key]] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setFile(null)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                  Batal
                </button>
                <button 
                  onClick={executeImport}
                  disabled={importing || !mapping["isrc"]}
                  className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition flex items-center gap-2 ${importing ? "bg-blue-400 cursor-not-allowed" : !mapping["isrc"] ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 active:scale-95"}`}
                >
                  {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {importing ? "Mengimport..." : "Mulai Import & Sinkronisasi"}
                </button>
              </div>
              {!mapping["isrc"] && <p className="text-xs text-red-500 mt-2 text-right">⚠️ Kolom ISRC wajib dipetakan untuk auto-match.</p>}
            </div>
          )}
        </div>

        {/* LOG HISTORY */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" /> Riwayat Import
          </h3>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada riwayat import.</p>
            ) : logs.map((log: any) => (
              <div key={log.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-purple-200 transition-all group relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 pr-6">
                    <p className="text-xs font-bold text-gray-900 truncate" title={log.fileName}>{log.fileName}</p>
                    <p className="text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${log.status === "SUCCESS" ? "bg-green-100 text-green-700" : log.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                    {log.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-white p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-400">Total Baris</p>
                    <p className="text-xs font-bold text-gray-900">{log.totalRows}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-400">Berhasil</p>
                    <p className="text-xs font-bold text-green-600">{log.successCount}</p>
                  </div>
                </div>

                {log.failedCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mb-2">
                      <AlertCircle className="w-3 h-3" /> {log.failedCount} Unmatched Songs
                    </p>
                    <div className="max-h-24 overflow-y-auto pr-1 space-y-1">
                      {log.unmatchedSongs?.map((u: any, i: number) => (
                        <div key={i} className="text-[9px] bg-red-50 p-1.5 rounded text-red-700 flex justify-between">
                          <span className="truncate">{u.isrc || u.upc || u.title || "Unknown"}</span>
                          <span className="opacity-70 flex-shrink-0 ml-2">{u.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => handleDeleteLog(log.id)}
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
