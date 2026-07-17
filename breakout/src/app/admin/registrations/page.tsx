import { PrismaClient } from "@prisma/client";
import { Check, X, Eye, FileText, ExternalLink } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { RegistrationActionButtons } from "./RegistrationActionButtons";
import Link from "next/link";

const prisma = new PrismaClient();

async function getSignedKtpUrl(path: string | null) {
  if (!path) return null;
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseUrl || !supabaseKey) return null;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.storage
    .from('identity-documents')
    .createSignedUrl(path, 60 * 60); // 1 hour valid
    
  if (error || !data) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  
  return data.signedUrl;
}

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const activeTab = searchParams.tab || "pending";

  const pendingUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'PENDING' },
    orderBy: { createdAt: 'desc' }
  });
  
  const rejectedUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'REJECTED' },
    orderBy: { createdAt: 'desc' }
  });

  const approvedUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'APPROVED' },
    orderBy: { createdAt: 'desc' }
  });

  let displayUsers = pendingUsers;
  if (activeTab === "approved") displayUsers = approvedUsers;
  if (activeTab === "rejected") displayUsers = rejectedUsers;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Identity Verification</h1>
        <p className="text-gray-500 text-sm">{pendingUsers.length} pending registrations</p>

        <div className="flex items-center gap-6 mt-8 border-b border-gray-100 pb-4">
          <Link 
            href="?tab=pending" 
            className={`font-bold pb-4 -mb-[18px] transition ${activeTab === 'pending' ? 'text-gray-900 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Pending ({pendingUsers.length})
          </Link>
          <Link 
            href="?tab=approved" 
            className={`font-bold pb-4 -mb-[18px] transition ${activeTab === 'approved' ? 'text-gray-900 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Approved ({approvedUsers.length})
          </Link>
          <Link 
            href="?tab=rejected" 
            className={`font-bold pb-4 -mb-[18px] transition ${activeTab === 'rejected' ? 'text-gray-900 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Rejected ({rejectedUsers.length})
          </Link>
        </div>

        <div className="mt-8 overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[1100px] space-y-3">
            {/* Table Header */}
            <div className="flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="w-48">Name</div>
              <div className="w-48">Email</div>
              <div className="w-32">WhatsApp</div>
              <div className="w-32">YouTube</div>
              <div className="w-32">Date</div>
              <div className="w-24">KTP</div>
              <div className="w-32">Status</div>
              {activeTab === 'pending' && <div className="w-32 flex justify-end">Action</div>}
            </div>

            {/* Rows */}
            {displayUsers.map(async (user) => {
              const ktpSignedUrl = await getSignedKtpUrl(user.ktpUrl);
              
              return (
                <div 
                  key={user.id} 
                  className="flex items-center px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition hover:bg-blue-50 hover:border-blue-200 group"
                >
                  <div className="w-48 font-bold text-gray-900 truncate pr-4">
                    {user.name}
                  </div>
                  
                  <div className="w-48 text-gray-500 text-sm truncate pr-4">
                    {user.email}
                  </div>

                  <div className="w-32 text-gray-500 text-sm pr-4">
                    {user.whatsapp || "-"}
                  </div>

                  <div className="w-32 text-gray-500 text-sm pr-4">
                    {user.youtubeUrl ? (
                      <a href={user.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium">
                        <ExternalLink className="w-4 h-4" /> Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                  
                  <div className="w-32 text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>

                  <div className="w-24">
                    {ktpSignedUrl ? (
                      <a href={ktpSignedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        <Eye className="w-4 h-4" /> View
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center gap-1">
                        <FileText className="w-4 h-4" /> N/A
                      </span>
                    )}
                  </div>
                  
                  <div className="w-32 flex items-center gap-2">
                    {activeTab === 'pending' && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                        <span className="text-orange-500 font-medium text-sm">Pending</span>
                      </>
                    )}
                    {activeTab === 'approved' && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        <span className="text-green-500 font-medium text-sm">Approved</span>
                      </>
                    )}
                    {activeTab === 'rejected' && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        <span className="text-red-500 font-medium text-sm">Rejected</span>
                      </>
                    )}
                  </div>
                  
                  {activeTab === 'pending' && (
                    <div className="w-32 flex justify-end gap-2">
                      <RegistrationActionButtons 
                        userId={user.id} 
                        userName={user.name || "Artist"} 
                        userEmail={user.email} 
                      />
                    </div>
                  )}
                </div>
              );
            })}
            
            {displayUsers.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No {activeTab} registrations found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
