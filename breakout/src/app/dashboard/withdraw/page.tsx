import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { CreditCard, DollarSign } from "lucide-react";
import { withdrawAction } from "@/app/actions/withdraw";

const prisma = new PrismaClient();

export default async function WithdrawPage() {
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { 
      artists: {
        include: { royalties: true }
      },
      withdrawRequests: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const totalRevenue = user?.artists?.reduce((acc, curr) => acc + curr.royalties.reduce((sum, r) => sum + r.totalRevenue, 0), 0) || 0;
  const totalWithdrawn = user?.withdrawRequests.filter(w => w.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const pendingWithdrawal = user?.withdrawRequests.filter(w => w.status === 'PENDING' || w.status === 'APPROVED').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  
  const availableBalance = totalRevenue - totalWithdrawn - pendingWithdrawal;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Withdraw Earnings</h1>
        <p className="text-gray-400">Request a payout to your bank account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-card p-6 border border-[#00F0FF]/30 bg-gradient-to-br from-[#00F0FF]/10 to-transparent">
          <p className="text-gray-400 text-sm font-medium mb-1">Available Balance</p>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#00F0FF] break-all">Rp {availableBalance.toLocaleString('id-ID')}</h3>
        </div>
        <div className="glass-card p-6">
          <p className="text-gray-400 text-sm font-medium mb-1">Pending Payouts</p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-500 break-all">Rp {pendingWithdrawal.toLocaleString('id-ID')}</h3>
        </div>
        <div className="glass-card p-6">
          <p className="text-gray-400 text-sm font-medium mb-1">Total Withdrawn</p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-300 break-all">Rp {totalWithdrawn.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#7000FF]" />
            Request Withdrawal
          </h2>
          
          <form action={async (formData) => { "use server"; await withdrawAction(formData); }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Amount (IDR)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-500 font-bold">Rp</span>
                <input required name="amount" type="number" step="1" max={availableBalance} className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 outline-none focus:border-[#7000FF] transition" placeholder="0" />
              </div>
              <p className="text-xs text-gray-500">Minimum withdrawal is Rp 50.000</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Bank Name</label>
              <input required name="bankName" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition" placeholder="e.g. BCA, Mandiri, BRI" />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Account Name</label>
              <input required name="accountName" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition" placeholder="Budi Santoso" />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Account Number</label>
              <input required name="accountNumber" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition" placeholder="1234567890" />
            </div>

            <button 
              type="submit"
              disabled={availableBalance < 50}
              className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-[#7000FF] to-[#0047FF] text-white font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Request
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">Recent Requests</h2>
          <div className="space-y-4">
            {user?.withdrawRequests.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-gray-400">No withdrawal requests yet.</p>
              </div>
            ) : (
              user?.withdrawRequests.map((req) => (
                <div key={req.id} className="glass-card p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">Rp {req.amount.toLocaleString('id-ID')}</h4>
                    <p className="text-sm text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${req.status === 'PAID' ? 'bg-green-500/20 text-green-500' : 
                        req.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                        req.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-red-500/20 text-red-500'}`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
