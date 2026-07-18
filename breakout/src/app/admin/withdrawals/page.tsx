import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { WithdrawalActionButtons } from "./WithdrawalActionButtons";

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
            <div className="space-y-3">
              {historyRequests.map(req => {
                const isPaid = req.status === 'PAID';
                const isRejected = req.status === 'REJECTED';
                const dateStr = new Date(req.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });
                const timeStr = new Date(req.updatedAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden transition hover:shadow-md ${
                      isPaid ? 'border-l-4 border-l-green-500 border-gray-200' :
                      isRejected ? 'border-l-4 border-l-red-500 border-gray-200' :
                      'border-l-4 border-l-blue-500 border-gray-200'
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      {/* Top row: Amount + Status badge */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                          Rp {req.amount.toLocaleString('id-ID')}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          isPaid ? 'bg-green-100 text-green-700' :
                          isRejected ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {isPaid && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                          {isRejected && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          {!isPaid && !isRejected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          {isPaid ? '✅ PAID' : isRejected ? '❌ REJECTED' : req.status}
                        </span>
                      </div>

                      {/* Artist name */}
                      <p className="text-blue-600 font-medium text-sm mb-3">
                        {req.user.artists?.[0]?.stageName || req.user.name}
                      </p>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Bank</p>
                          <p className="font-semibold text-gray-900">{req.bankName}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Rekening</p>
                          <p className="font-semibold text-gray-900 font-mono text-xs">{req.accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Nama</p>
                          <p className="font-semibold text-gray-900">{req.accountName}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Tanggal</p>
                          <p className="font-semibold text-gray-900">{dateStr}</p>
                          <p className="text-gray-400 text-[11px]">{timeStr}</p>
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
