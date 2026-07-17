import { PrismaClient } from "@prisma/client";
import { Check, X } from "lucide-react";
import { revalidatePath } from "next/cache";

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

                  <div className="mt-auto flex gap-3 border-t border-gray-100 pt-4">
                    <form action={updateWithdrawalStatus} className="flex-1">
                      <input type="hidden" name="requestId" value={req.id} />
                      <input type="hidden" name="userId" value={req.userId} />
                      <input type="hidden" name="amount" value={req.amount} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button type="submit" className="w-full py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-medium transition flex items-center justify-center gap-2">
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </form>
                    <form action={updateWithdrawalStatus} className="flex-1">
                      <input type="hidden" name="requestId" value={req.id} />
                      <input type="hidden" name="userId" value={req.userId} />
                      <input type="hidden" name="amount" value={req.amount} />
                      <input type="hidden" name="status" value="PAID" />
                      <button type="submit" className="w-full py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition flex items-center justify-center gap-2 shadow-sm">
                        <Check className="w-4 h-4" /> Mark Paid
                      </button>
                    </form>
                  </div>
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
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                  <th className="p-4 font-medium">Artist</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Bank Details</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyRequests.map(req => (
                  <tr key={req.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900">{req.user.artists?.[0]?.stageName || req.user.name}</td>
                    <td className="p-4 font-bold text-gray-900">Rp {req.amount.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-sm">
                      <p className="text-gray-900">{req.bankName}</p>
                      <p className="text-gray-500 text-xs">{req.accountNumber}</p>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{new Date(req.updatedAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold
                        ${req.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                          req.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'}`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
