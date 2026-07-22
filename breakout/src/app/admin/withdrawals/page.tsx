import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { WithdrawalActionButtons } from "./WithdrawalActionButtons";
import { sendWithdrawalPaidEmail } from "@/lib/email";

const prisma = new PrismaClient();

export default async function AdminWithdrawalsPage() {
  const pendingRequests = await prisma.withdrawRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: { include: { artists: true } } },
    orderBy: { createdAt: 'asc' }
  });

  const historyRequests = await prisma.withdrawRequest.findMany({
    where: { status: { not: 'PENDING' } },
    include: { user: { include: { artists: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 50
  });

  async function updateWithdrawalStatus(formData: FormData) {
    "use server";
    const requestId = formData.get("requestId") as string;
    const status = formData.get("status") as any;
    const userId = formData.get("userId") as string;
    const amount = formData.get("amount") as string;

    await prisma.withdrawRequest.update({
      where: { id: requestId },
      data: { status }
    });

    await prisma.notification.create({
      data: {
        userId,
        title: `Withdrawal ${status}`,
        message: `Your withdrawal request of Rp ${amount} has been ${status.toLowerCase()}.`
      }
    });

    if (status === 'PAID') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { artists: true }
      });
      if (user?.email) {
        const artistName = user.artists?.[0]?.stageName || user.name || "Artist";
        await sendWithdrawalPaidEmail(user.email, artistName);
      }
    }

    revalidatePath("/admin/withdrawals");
    revalidatePath("/dashboard/withdraw");
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal Management</h1>
        <p className="text-gray-500">Process and manage artist payouts.</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Pending Requests ({pendingRequests.length})
          </h2>
          
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
              No pending withdrawal requests.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Rp {req.amount.toLocaleString('id-ID')}</h3>
                      <p className="text-blue-600 font-medium">{req.user.artists?.[0]?.stageName || req.user.name}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">PENDING</span>
                  </div>
                  
                  <div className="space-y-2 mb-6 p-4 bg-gray-50 rounded-lg text-sm">
                    <p><span className="text-gray-500 block text-xs">Bank Name</span><span className="font-semibold text-gray-900">{req.bankName}</span></p>
                    <p><span className="text-gray-500 block text-xs">Account Name</span><span className="font-semibold text-gray-900">{req.accountName}</span></p>
                    <p><span className="text-gray-500 block text-xs">Account Number</span><span className="font-semibold text-gray-900 font-mono tracking-wider">{req.accountNumber}</span></p>
                  </div>

                  <WithdrawalActionButtons req={req} updateAction={updateWithdrawalStatus} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            History (Latest 50)
          </h2>

          {historyRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
              No withdrawal history yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {historyRequests.map(req => {
                const isPaid = req.status === 'PAID';
                const isRejected = req.status === 'REJECTED';
                const dateStr = new Date(req.updatedAt).toLocaleDateString('id-ID', {
                  day: '2-digit', month: '2-digit', year: '2-digit'
                });

                return (
                  <div
                    key={req.id}
                    className="relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                    style={{
                      background: isPaid 
                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' // Green for paid
                        : isRejected 
                        ? 'linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)' // Red for rejected
                        : 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)', // Blue/Purple for other
                    }}
                  >
                    {/* Card background pattern */}
                    <div className="absolute inset-0 opacity-[0.15]"
                      style={{
                        backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                      }}
                    />
                    
                    {/* Holographic stripe */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-20"
                      style={{
                        background: 'linear-gradient(135deg, transparent, rgba(255,255,255,0.5), rgba(255,255,255,0.8), transparent)',
                        borderRadius: '0 1rem 0 100%',
                      }}
                    />

                    <div className="relative h-full flex flex-col justify-between p-5">
                      {/* Top row: Amount + Chip + Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="w-10 h-7 rounded-md overflow-hidden mb-3"
                            style={{
                              background: 'linear-gradient(135deg, #c9a84c 0%, #f4d03f 30%, #c9a84c 50%, #f4d03f 70%, #c9a84c 100%)',
                            }}
                          >
                            <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px] p-[2px]">
                              {[...Array(9)].map((_, i) => (
                                <div key={i} className="bg-[#c9a84c]/40 rounded-[1px]" />
                              ))}
                            </div>
                          </div>
                          <p className="text-white/70 text-[10px] font-medium tracking-widest mb-0.5">AMOUNT</p>
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none drop-shadow-sm">
                            Rp {req.amount.toLocaleString('id-ID')}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-sm">
                            {isPaid ? '✅ PAID' : isRejected ? '❌ REJECTED' : req.status}
                          </span>
                        </div>
                      </div>

                      {/* Middle row: Rekening Number */}
                      <div className="mt-4">
                        <p className="text-white text-lg sm:text-xl font-mono tracking-[0.2em] drop-shadow-sm">
                          {req.accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
                        </p>
                      </div>

                      {/* Bottom row: Name + Bank + Date */}
                      <div className="flex items-end justify-between mt-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-white/70 text-[9px] tracking-[0.15em] mb-0.5 uppercase">ACCOUNT HOLDER</p>
                          <p className="text-white font-bold text-xs sm:text-sm tracking-wide uppercase truncate">
                            {req.accountName}
                          </p>
                          <p className="text-white/90 text-[10px] font-medium mt-0.5 truncate">
                            {req.bankName} • {req.user.artists?.[0]?.stageName || req.user.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white/70 text-[9px] tracking-[0.15em] mb-0.5 uppercase">DATE</p>
                          <p className="text-white font-bold text-xs font-mono">{dateStr}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
