"use client";

import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toJpeg } from "html-to-image";
import { getContractUploadUrlsAction, finalizeContractAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

interface ContractStepProps {
  userId: string;
  name: string;
  nik: string;
  address: string;
  email: string;
  whatsapp: string;
}

export default function ContractStep({ userId, name, nik, address, email, whatsapp }: ContractStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const handleSignContract = async () => {
    if (!agreed) {
      setError("Anda harus menyetujui isi perjanjian.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Generate full-height image using html-to-image
      if (!contractRef.current) throw new Error("Contract element not found");
      
      const contractEl = contractRef.current!;
      
      // We will clone the node, set it to full height and append it to body invisibly to capture it perfectly
      const clone = contractEl.cloneNode(true) as HTMLDivElement;
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.width = "800px"; // Fixed width for consistent formatting
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.overflow = "visible";
      clone.style.backgroundColor = "#ffffff";
      clone.style.color = "#000000";
      
      document.body.appendChild(clone);
      
      const dataUrl = await toJpeg(clone, {
        quality: 0.9,
        backgroundColor: "#ffffff",
        pixelRatio: 2
      });
      
      document.body.removeChild(clone);

      if (!dataUrl) throw new Error("Failed to create contract image");
      const contractBlob = await (await fetch(dataUrl)).blob();

      // 2. Get signed upload URLs from server
      const urlsRes = await getContractUploadUrlsAction(userId);
      if (urlsRes?.error || !urlsRes.pdf) {
        throw new Error(urlsRes?.error || "Gagal menyiapkan penyimpanan.");
      }

      // 3. Upload Contract JPEG Blob (contractBlob is already created above)
      
      const pdfUpload = await fetch(urlsRes.pdf.url, {
        method: "PUT",
        body: contractBlob,
        headers: { "Content-Type": "image/jpeg" }
      });
      if (!pdfUpload.ok) throw new Error("Gagal mengunggah gambar kontrak");

      // 4. Finalize in database
      const signaturePath = "agreed-digitally";
      const finalizeRes = await finalizeContractAction(userId, signaturePath, urlsRes.pdf.path);
      
      if (finalizeRes?.error) {
        setError(finalizeRes.error);
        setLoading(false);
      } else {
        router.push(`/register/success?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&whatsapp=${encodeURIComponent(whatsapp)}`);
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan saat memproses kontrak. " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-8 md:p-12 rounded-2xl shadow-2xl my-10 relative z-10 animate-fade-in text-sm md:text-base">
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {/* Contract Content to be PDF'd */}
      <div ref={contractRef} className="space-y-6 pb-12 bg-white px-2">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-8 uppercase underline underline-offset-4">Perjanjian Distribusi Digital</h1>
        
        <p className="text-justify">
          Pada hari ini {today.toLocaleDateString("id-ID", { weekday: 'long' })}, tanggal {dateStr} dibuat dan disepakati Perjanjian Distribusi Digital oleh dan antara:
        </p>

        <div className="space-y-1 font-semibold pl-4">
          <p>PIHAK PERTAMA</p>
          <div className="grid grid-cols-[120px_auto] gap-2 font-normal">
            <div>Perusahaan/Label</div><div>: BREAK OUT MUSIC RECORD</div>
            <div>Nama</div><div>: Muhammad Belva Citta Apprillio</div>
            <div>Jabatan</div><div>: Founder & CEO</div>
            <div>Publishing</div><div>: BREAK OUT MUSIC RECORD</div>
            <div>Alamat</div><div>: Perum Griya Winong Indah Baru 2 No. 28, Pati, Jawa Tengah, Indonesia</div>
          </div>
        </div>

        <p className="text-justify">
          Dalam hal ini bertindak untuk dan atas nama BREAK OUT MUSIC RECORD, selanjutnya disebut sebagai <strong>"PIHAK PERTAMA"</strong>.
        </p>

        <div className="space-y-1 font-semibold pl-4">
          <p>PIHAK KEDUA</p>
          <div className="grid grid-cols-[120px_auto] gap-2 font-normal">
            <div>Nama</div><div>: {name}</div>
            <div>NIK</div><div>: {nik}</div>
            <div>Alamat</div><div>: {address}</div>
          </div>
        </div>

        <p className="text-justify">
          Dalam hal ini bertindak untuk dan atas nama dirinya sendiri selaku pemilik atau pemegang hak atas karya yang didistribusikan, selanjutnya disebut sebagai <strong>"PIHAK KEDUA"</strong>.
        </p>

        <p className="text-justify">
          Kedua belah pihak telah setuju dan mufakat untuk mengadakan dan menandatangani perjanjian ini dengan ketentuan dan syarat-syarat sebagai berikut:
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">1. PEMBERIAN HAK</h3>
            <p className="text-justify mb-2">PIHAK KEDUA dengan ini melisensikan secara eksklusif kepada PIHAK PERTAMA, selama jangka waktu yang ditentukan dan untuk seluruh wilayah (World Wide) berupa semua hak atas Master Audio dan Video Master untuk tujuan berikut:</p>
            <ol className="list-[upper-alpha] pl-8 space-y-2 text-justify">
              <li>PIHAK KEDUA memberikan hak kepada PIHAK PERTAMA untuk mengeksploitasi Master Audio dan Video Master dalam semua format digital yang sudah ada maupun yang akan dibuat di kemudian hari, termasuk namun tidak terbatas pada unduhan digital, streaming lagu individu, album, track, dan video.</li>
              <li>PIHAK KEDUA memberikan hak dan kuasa penuh kepada PIHAK PERTAMA untuk menjalin kerja sama dengan pihak mana pun guna mengumpulkan, menerima, mengelola, dan mendistribusikan seluruh pendapatan yang timbul dari distribusi karya dalam berbagai bentuk.</li>
              <li>PIHAK PERTAMA memperoleh hak eksklusif di seluruh wilayah untuk mengelola dan mengklaim hak atas Master Audio dan/atau Video Master yang digunakan dalam sinkronisasi dengan konten audiovisual pada berbagai layanan media, termasuk film, program televisi, permainan, iklan, dan bentuk penggunaan lainnya yang menghasilkan pendapatan royalti.</li>
              <li>PIHAK PERTAMA dan PIHAK KEDUA sepakat untuk membagi hasil distribusi dengan komposisi sebesar 72,5% untuk PIHAK KEDUA dan 27,5% untuk PIHAK PERTAMA.</li>
              <li>PIHAK PERTAMA dan PIHAK KEDUA sepakat bahwa masa berlaku Perjanjian ini adalah selama 2 (dua) tahun sejak tanggal ditandatangani. PIHAK PERTAMA berhak mengakhiri Perjanjian secara sepihak apabila PIHAK KEDUA terbukti melanggar ketentuan dalam Perjanjian ini maupun kebijakan yang berlaku di BREAK OUT MUSIC RECORD.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. DISTRIBUSI</h3>
            <p className="text-justify">PIHAK KEDUA menyetujui pendistribusian karya oleh PIHAK PERTAMA selama jangka waktu yang telah disepakati. PIHAK PERTAMA akan menyediakan layanan distribusi dan sinkronisasi digital untuk mendistribusikan Master Audio, Master Video, dan Karya Seni dalam seluruh bentuk distribusi digital yang tersedia saat ini maupun yang akan tersedia di masa mendatang.</p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. KEWAJIBAN</h3>
            <ol className="list-[upper-alpha] pl-8 space-y-2 text-justify">
              <li>BREAK OUT MUSIC RECORD akan menyediakan area akun pribadi yang aman ("Area Pribadi Anda") yang dioperasikan melalui jaringan dan sistem milik BREAK OUT MUSIC RECORD.</li>
              <li>Dengan ditandatanganinya perjanjian ini, PIHAK KEDUA dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku pada sistem BREAK OUT MUSIC RECORD.</li>
              <li>PIHAK KEDUA bertanggung jawab untuk menjaga kerahasiaan akun dan bertanggung jawab penuh atas seluruh aktivitas yang dilakukan melalui Area Pribadi miliknya. PIHAK KEDUA wajib segera memberitahukan kepada BREAK OUT MUSIC RECORD apabila terjadi penggunaan akun tanpa izin.</li>
              <li>PIHAK KEDUA dilarang mengunggah, mendistribusikan, atau menyerahkan karya musik yang bukan merupakan ciptaan, hak milik, atau hak distribusi yang sah milik PIHAK KEDUA, termasuk namun tidak terbatas pada lagu Barat, lagu milik artis lain, cover song, remake, re-upload, bootleg, karya hasil plagiarisme, karya yang melanggar hak cipta dan hak terkait, serta karya yang menggunakan teknologi Artificial Intelligence (AI) atau Vokal AI yang meniru, menyerupai, atau menggunakan suara, identitas, karakteristik vokal, maupun kemiripan artis, penyanyi, publik figur, atau pihak lain tanpa izin yang sah. Setiap karya yang akan didistribusikan wajib memiliki hak penggunaan dan perizinan yang sah sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.</li>
              <li>PIHAK KEDUA dilarang menggunakan nama artis, nama rilisan, judul lagu, nama album, maupun metadata yang mengandung kata atau istilah "RMX", "REMIX", "RIMEX", "DJ", "FULL BASS", "MASHUP", "AI", "AI COVER", "AI REMIX", "AI VERSION", atau istilah lain yang dapat menyesatkan, melanggar kebijakan toko digital, atau menimbulkan kesan sebagai karya remix, edit, modifikasi, atau karya berbasis kecerdasan buatan tanpa izin resmi dari pemegang hak.</li>
              <li>PIHAK PERTAMA berhak menolak, menunda, menghapus (take down), atau menghentikan distribusi karya yang dianggap melanggar ketentuan dalam Perjanjian ini maupun kebijakan toko digital tanpa kewajiban memberikan kompensasi kepada PIHAK KEDUA.</li>
              <li>Apabila PIHAK KEDUA terbukti melakukan pelanggaran hak cipta, penggunaan metadata yang menyesatkan, penggunaan karya AI atau Vokal AI yang tidak sah, penggunaan lagu Barat tanpa izin, cover song tanpa izin, atau pelanggaran berulang terhadap ketentuan Perjanjian ini, maka PIHAK PERTAMA berhak memutus Perjanjian secara sepihak, menonaktifkan akun distribusi, menahan pembayaran royalti yang masih dalam proses verifikasi, serta mengambil tindakan lain yang dianggap perlu sesuai ketentuan yang berlaku.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. PERNYATAAN JAMINAN DAN GANTI RUGI</h3>
            <p className="text-justify mb-2">PIHAK KEDUA berjanji, menyatakan, dan menjamin bahwa:</p>
            <ol className="list-[upper-alpha] pl-8 space-y-2 text-justify">
              <li>PIHAK KEDUA memiliki hak dan kewenangan penuh untuk menandatangani perjanjian ini dan tidak akan melakukan tindakan yang bertentangan dengan isi perjanjian.</li>
              <li>Seluruh biaya yang terkait dengan perekaman Audio Master, Video Master, dan Artwork telah dibayar lunas dan menjadi tanggung jawab PIHAK KEDUA.</li>
              <li>Sebelum melakukan pengiriman Metadata, aset, Audio Master, Video Master, maupun Karya Seni ke dalam sistem BREAK OUT MUSIC RECORD, PIHAK KEDUA wajib memperoleh izin tertulis dari seluruh pemegang hak yang terkait sesuai dengan peraturan perundang-undangan yang berlaku.</li>
              <li>Tidak terdapat Master Audio maupun Video Master yang melanggar hak pihak lain ataupun melanggar ketentuan hukum yang berlaku.</li>
              <li>Tidak terdapat Master Audio, Master Video, Metadata, maupun Karya Seni yang mengandung unsur fitnah, pornografi, atau pelanggaran hukum lainnya.</li>
              <li>Apabila terdapat tuntutan, gugatan, klaim, sengketa, atau permasalahan hukum dari Pihak Ketiga maupun pihak manapun yang berkaitan dengan hak cipta, hak terkait, hak kepemilikan, perizinan, penggunaan, distribusi, metadata, Artwork, Master Audio, Master Video, maupun Karya Seni yang diserahkan oleh PIHAK KEDUA kepada PIHAK PERTAMA, maka seluruh tanggung jawab penyelesaian, biaya hukum, biaya perkara, ganti rugi, denda, serta biaya lain yang timbul akibat tuntutan tersebut sepenuhnya menjadi tanggung jawab PIHAK KEDUA. PIHAK PERTAMA dibebaskan dari segala tuntutan, kewajiban, kerugian, maupun biaya yang timbul sehubungan dengan perkara tersebut. PIHAK KEDUA wajib mengganti seluruh kerugian yang diderita PIHAK PERTAMA akibat adanya tuntutan atau pelanggaran tersebut.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. PELAPORAN DAN PEMBAYARAN</h3>
            <ol className="list-[upper-alpha] pl-8 space-y-2 text-justify">
              <li>Pelaporan penjualan akan diberikan oleh PIHAK PERTAMA kepada PIHAK KEDUA setiap tanggal 5 setiap bulannya. Laporan pertama akan diberikan setelah melewati masa tunggu 90 (sembilan puluh) hari sejak materi, metadata, dan aset pertama kali diunggah ke sistem distribusi.<br/><br/>Contoh: apabila materi diunggah pada bulan Januari, maka laporan pertama akan diberikan pada tanggal 5 bulan April. Selanjutnya, laporan penjualan akan diberikan setiap tanggal 5 pada bulan-bulan berikutnya.</li>
              <li>Pembayaran akan dilakukan setelah PIHAK KEDUA mengajukan invoice sesuai dengan laporan yang diterima.</li>
              <li>Pengajuan invoice dapat dilakukan apabila jumlah tagihan telah mencapai nilai Rp10.000 (Sepuluh Ribu Rupiah).</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold mb-2">6. KETENTUAN UMUM</h3>
            <ol className="list-[upper-alpha] pl-8 space-y-2 text-justify">
              <li>Para Pihak sepakat untuk menjaga kerahasiaan seluruh informasi dan dokumen yang digunakan dalam pelaksanaan perjanjian ini, baik selama masa berlaku perjanjian maupun setelah perjanjian berakhir.</li>
              <li>Hal-hal yang belum atau tidak cukup diatur dalam perjanjian ini akan diatur lebih lanjut dalam Addendum atau Amandemen yang menjadi bagian tidak terpisahkan dari perjanjian ini.</li>
              <li>Setiap perselisihan yang timbul akibat pelaksanaan perjanjian ini akan diselesaikan terlebih dahulu secara musyawarah untuk mencapai mufakat.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold mb-2">7. PENUTUP</h3>
            <ol className="list-[upper-alpha] pl-8 space-y-2 text-justify">
              <li>Perjanjian ini dibuat dan ditandatangani oleh kedua belah pihak dalam keadaan sadar, sehat jasmani dan rohani, serta tanpa adanya paksaan dari pihak manapun.</li>
              <li>Demikian perjanjian ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</li>
            </ol>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center">
            <p className="mb-16">Pati, Jawa Tengah, {dateStr}</p>
            <p className="font-bold">PIHAK PERTAMA</p>
            <p className="mb-16">BREAK OUT MUSIC RECORD</p>
            <p className="font-bold underline">Muhammad Belva Citta Apprillio</p>
            <p>Founder & CEO</p>
          </div>
          
          <div className="text-center relative min-w-[250px]">
            <p className="mb-12">PIHAK KEDUA</p>
            {agreed && (
              <div className="mx-auto h-20 w-48 flex items-center justify-center -mt-8 mb-4 pointer-events-none text-blue-600 font-bold italic border-2 border-blue-200 bg-blue-50/50 rounded-lg transform -rotate-2">
                Disetujui secara digital
              </div>
            )}
            
            <p className="font-bold underline pt-4 border-t border-gray-300 w-full inline-block mt-4">{name}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 border-t border-gray-200 pt-8 bg-gray-50 -mx-8 md:-mx-12 px-8 md:px-12 pb-8 rounded-b-2xl">
        <h3 className="font-bold text-lg mb-4 text-center">Persetujuan Kontrak</h3>
        <p className="text-gray-500 text-sm text-center mb-6">Silakan centang kotak di bawah ini sebagai tanda persetujuan Anda terhadap seluruh isi perjanjian di atas.</p>

        <div className="max-w-md mx-auto mt-8 flex items-start gap-3">
          <div className="flex items-center h-5 mt-0.5">
            <input 
              id="agree-contract" 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded border-gray-400 text-[#0047FF] focus:ring-[#0047FF] cursor-pointer" 
            />
          </div>
          <label htmlFor="agree-contract" className="text-gray-700 font-medium cursor-pointer">
            Saya telah membaca, memahami, dan menyetujui seluruh isi Perjanjian Distribusi Digital.
          </label>
        </div>

        <div className="max-w-md mx-auto mt-8">
          <button 
            type="button" 
            onClick={handleSignContract}
            disabled={loading || !agreed}
            className="w-full bg-[#0047FF] hover:bg-blue-700 transition text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Saya Setuju"}
          </button>
        </div>
      </div>
      
    </div>
  );
}
