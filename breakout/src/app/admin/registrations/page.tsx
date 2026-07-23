import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { RegistrationCards } from "./RegistrationCards";

const prisma = new PrismaClient();

async function getSignedKtpUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
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
  if (path.startsWith("http")) return path;
  if (path === "sent-via-email" || path === "agreed-digitally") return null;
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

export default async function AdminRegistrationsPage() {
  // Fetch all non-rejected users (pending + approved) in one list
  const allUsers = await prisma.user.findMany({
    where: { role: 'USER', status: { in: ['PENDING', 'APPROVED'] } },
    include: { contracts: true },
  });

  // Explicitly sort: PENDING first, APPROVED second. Within each, newest first.
  allUsers.sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pendingCount = allUsers.filter(u => u.status === 'PENDING').length;
  const approvedCount = allUsers.filter(u => u.status === 'APPROVED').length;

  // Pre-sign all URLs server-side
  const cardsData = await Promise.all(
    allUsers.map(async (user) => {
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
        <p className="text-gray-500 text-sm">
          <span className="text-yellow-600 font-semibold">{pendingCount} pending</span>
          {" · "}
          <span className="text-green-600 font-semibold">{approvedCount} approved</span>
          {" · "}
          <span className="font-semibold">{allUsers.length} total</span>
        </p>
      </div>

      {/* Cards */}
      {allUsers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-lg font-semibold">Belum ada registrasi.</p>
        </div>
      ) : (
        <RegistrationCards cards={cardsData} />
      )}
    </div>
  );
}
