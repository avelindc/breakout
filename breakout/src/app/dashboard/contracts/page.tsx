import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FileText, Download, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function getSignedContractUrl(path: string | null) {
  if (!path) return null;
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseUrl || !supabaseKey) return null;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.storage
    .from('contracts')
    .createSignedUrl(path, 60 * 60); // 1 hour valid
    
  if (error || !data) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  
  return data.signedUrl;
}

export default async function ContractsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      contracts: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) redirect("/login");

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kontrak Saya</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8 ml-14">
          Kelola dan unduh dokumen perjanjian distribusi digital Anda.
        </p>

        <div className="space-y-4">
          {user.contracts.length > 0 ? (
            user.contracts.map(async (contract, idx) => {
              const pdfUrl = await getSignedContractUrl(contract.pdfUrl);
              const isLatest = idx === 0;

              return (
                <div 
                  key={contract.id} 
                  className={`flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl border transition ${isLatest ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className={`p-3 rounded-xl ${isLatest ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        Perjanjian Distribusi Digital 
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-medium">v{contract.version}</span>
                        {isLatest && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold ml-1">Terbaru</span>}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> Ditandatangani: {new Date(contract.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="hidden md:flex items-center gap-1 text-green-600 text-sm font-medium mr-4">
                      <CheckCircle className="w-4 h-4" /> Disetujui
                    </div>
                    
                    {pdfUrl ? (
                      <a 
                        href={pdfUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-xl transition font-medium text-sm shadow-sm"
                      >
                        <FileText className="w-4 h-4" /> Lihat PDF
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm italic">PDF tidak tersedia</span>
                    )}
                    
                    {pdfUrl && (
                      <a 
                        href={pdfUrl} 
                        download={`Kontrak_Distribusi_v${contract.version}_${user.name}.pdf`}
                        target="_blank"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium text-sm shadow-sm shadow-blue-200"
                      >
                        <Download className="w-4 h-4" /> Unduh
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Belum ada kontrak</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Anda belum memiliki kontrak yang ditandatangani. Kontrak akan muncul di sini setelah Anda menyelesaikannya pada tahap pendaftaran.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
