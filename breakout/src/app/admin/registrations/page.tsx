import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { RegistrationCards } from "./RegistrationCards";

const prisma = new PrismaClient();

async function getSignedKtpUrl(path: string | null) {
  if (!path) return null;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !supabaseKey) return null;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.storage
    .from('identity-documents')
    .createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

async function getSignedContractUrl(path: string | null) {
  if (!path) return null;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !supabaseKey) return null;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.storage
    .from('contracts')
    .createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const activeTab = params.tab || "pending";

  const pendingUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'PENDING' },
    include: { contracts: true },
    orderBy: { createdAt: 'desc' }
  });

  const rejectedUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'REJECTED' },
    include: { contracts: true },
    orderBy: { createdAt: 'desc' }
  });

  const approvedUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'APPROVED' },
    include: { contracts: true },
    orderBy: { createdAt: 'desc' }
  });

  let displayUsers = pendingUsers;
  if (activeTab === "approved") displayUsers = approvedUsers;
  if (activeTab === "rejected") displayUsers = rejectedUsers;

  // Pre-sign all URLs server-side
  const cardsData = await Promise.all(
    displayUsers.map(async (user) => {
      const ktpUrl = await getSignedKtpUrl(user.ktpUrl);
      const contractUrl = user.contracts?.[0]
        ? await getSignedContractUrl(user.contracts[0].pdfUrl)
        : null;
      const signatureUrl = user.contracts?.[0]?.signatureUrl || null;
      return {
        id: user.id,
        name: user.name || "Unknown",
        email: user.email,
        whatsapp: user.whatsapp || null,
        nik: user.nik || null,
        address: user.address || null,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        ktpUrl,
        contractUrl,
        signatureUrl,
        hasContract: (user.contracts?.length || 0) > 0,
        contractSignedAt: user.contracts?.[0]?.signedAt?.toISOString() || null,
      };
    })
  );

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      {/* Header */}
      <div className="mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Identity Verification</h1>
        <p className="text-gray-500 text-sm">{pendingUsers.length} pending registrations</p>

        <div className="flex items-center gap-4 md:gap-6 mt-8 border-b border-gray-100 pb-4 overflow-x-auto scrollbar-hide">
          <Link
            href="?tab=pending"
            className={`font-bold pb-4 -mb-[18px] transition whitespace-nowrap text-sm md:text-base ${activeTab === 'pending' ? 'text-gray-900 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Pending ({pendingUsers.length})
          </Link>
          <Link
            href="?tab=approved"
            className={`font-bold pb-4 -mb-[18px] transition whitespace-nowrap text-sm md:text-base ${activeTab === 'approved' ? 'text-gray-900 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Approved ({approvedUsers.length})
          </Link>
          <Link
            href="?tab=rejected"
            className={`font-bold pb-4 -mb-[18px] transition whitespace-nowrap text-sm md:text-base ${activeTab === 'rejected' ? 'text-gray-900 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Rejected ({rejectedUsers.length})
          </Link>
        </div>
      </div>

      {/* Cards */}
      {displayUsers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-lg font-semibold">No {activeTab} registrations found.</p>
        </div>
      ) : (
        <RegistrationCards cards={cardsData} activeTab={activeTab} />
      )}
    </div>
  );
}
