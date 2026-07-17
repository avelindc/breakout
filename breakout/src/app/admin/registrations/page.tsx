import { PrismaClient } from "@prisma/client";
import { Check, X, Eye, FileText } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { RegistrationActionButtons } from "./RegistrationActionButtons";

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

export default async function AdminRegistrationsPage() {
  const pendingUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'PENDING' },
    orderBy: { createdAt: 'desc' }
  });
  
  const rejectedUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'REJECTED' },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Identity Verification</h1>
        <p className="text-gray-500 text-sm">{pendingUsers.length} pending registrations</p>

        <div className="flex items-center gap-6 mt-8 border-b border-gray-100 pb-4">
          <button className="text-gray-900 font-bold border-b-2 border-blue-600 pb-4 -mb-[18px]">Pending</button>
          <button className="text-gray-400 font-medium pb-4 -mb-[18px]">Rejected</button>
        </div>

        <div className="mt-8 overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[1000px] space-y-3">
            {/* Table Header */}
            <div className="flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="w-48">Name</div>
              <div className="w-48">Email</div>
              <div className="w-36">WhatsApp</div>
              <div className="w-32">Date</div>
              <div className="w-24">KTP</div>
              <div className="w-32">Status</div>
              <div className="w-32 flex justify-end">Action</div>
            </div>

            {/* Pending Rows */}
            {pendingUsers.map(async (user) => {
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

                  <div className="w-36 text-gray-500 text-sm pr-4">
                    {user.whatsapp || "-"}
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
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                    <span className="text-orange-500 font-medium text-sm">Pending</span>
                  </div>
                  
                  <div className="w-32 flex justify-end gap-2">
                    <RegistrationActionButtons 
                      userId={user.id} 
                      userName={user.name || "Artist"} 
                      userEmail={user.email} 
                    />
                  </div>
                </div>
              );
            })}
            
            {pendingUsers.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No pending registrations found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
