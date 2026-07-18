import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { CreditCard, Wallet, ArrowDownLeft, Clock, CheckCircle2, XCircle, Wifi } from "lucide-react";
import { WithdrawForm } from "@/components/WithdrawForm";

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

  const artistName = user?.artists?.[0]?.stageName || user?.name || "Artist";
  const profileImage = user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'default'}`;

  const totalRevenue = user?.artists?.reduce((acc, curr) => acc + curr.royalties.reduce((sum, r) => sum + r.totalRevenue, 0), 0) || 0;
  const totalWithdrawn = user?.withdrawRequests.filter(w => w.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const pendingWithdrawal = user?.withdrawRequests.filter(w => w.status === 'PENDING' || w.status === 'APPROVED').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  
  const availableBalance = totalRevenue - totalWithdrawn - pendingWithdrawal;

  const last4 = (user?.id || "0000").slice(-4).toUpperCase();

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="mb-10 relative">
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#7000FF]/10 rounded-full blur-3xl pointer-events-none" />
        <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight text-gray-900 relative">
          Withdraw <span className="bg-gradient-to-r from-[#7000FF] to-[#00F0FF] text-transparent bg-clip-text">Earnings</span>
        </h1>
        <p className="text-gray-500 text-sm sm:text-base font-medium max-w-md relative">
          Transfer your available balance directly to your registered bank account.
        </p>
      </div>

      {/* ═══ VISA-STYLE CARD ═══ */}
      <div className="mb-10 relative perspective-[1200px]">
        <div className="relative w-full max-w-md mx-auto aspect-[1.6/1] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          }}
        >
          {/* Card background pattern */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(120,80,255,0.4) 0%, transparent 50%)`,
            }}
          />
          {/* Holographic stripe */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20"
            style={{
              background: 'linear-gradient(135deg, transparent, rgba(0,240,255,0.5), rgba(112,0,255,0.5), transparent)',
              borderRadius: '0 1rem 0 100%',
            }}
          />

          <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
            {/* Top row: Chip + Wifi + Logo */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* EMV Chip */}
                <div className="w-10 h-7 sm:w-12 sm:h-8 rounded-md overflow-hidden"
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
                <Wifi className="w-5 h-5 text-white/40 rotate-90" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 font-medium tracking-widest">BREAKOUT</p>
                <p className="text-white font-bold text-sm tracking-wider">PLATINUM</p>
              </div>
            </div>

            {/* Balance */}
            <div>
              <p className="text-white/50 text-[11px] sm:text-xs font-medium tracking-wider mb-1">AVAILABLE BALANCE</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                Rp {availableBalance.toLocaleString('id-ID')}
              </h2>
            </div>

            {/* Bottom row: Name + Profile */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/40 text-[9px] sm:text-[10px] tracking-[0.2em] font-medium mb-0.5">CARD HOLDER</p>
                <p className="text-white font-bold text-sm sm:text-base tracking-wide uppercase">{artistName}</p>
                <p className="text-white/30 text-[10px] font-mono tracking-[0.3em] mt-0.5">•••• •••• •••• {last4}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-lg shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profileImage} alt={artistName} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STATS MINI CARDS ═══ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-10 max-w-md mx-auto">
        <div className="glass-card p-4 sm:p-5 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-yellow-500" />
            </div>
            <p className="text-gray-400 text-[11px] sm:text-xs font-medium">Pending</p>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-yellow-500 break-all">Rp {pendingWithdrawal.toLocaleString('id-ID')}</h3>
        </div>
        <div className="glass-card p-4 sm:p-5 border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 text-green-500" />
            </div>
            <p className="text-gray-400 text-[11px] sm:text-xs font-medium">Withdrawn</p>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-green-400 break-all">Rp {totalWithdrawn.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      {/* ═══ FORM + HISTORY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-card p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#7000FF]" />
            Request Withdrawal
          </h2>
          <WithdrawForm availableBalance={availableBalance} />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#00F0FF]" />
            Recent Requests
          </h2>
          <div className="space-y-3">
            {user?.withdrawRequests.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-gray-400">No withdrawal requests yet.</p>
              </div>
            ) : (
              user?.withdrawRequests.map((req) => {
                const isPaid = req.status === 'PAID';
                const isRejected = req.status === 'REJECTED';
                const isPending = req.status === 'PENDING';
                const dateStr = new Date(req.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });

                return (
                  <div key={req.id} className={`glass-card p-4 sm:p-5 border-l-4 transition hover:scale-[1.01] ${
                    isPaid ? 'border-l-green-500' :
                    isRejected ? 'border-l-red-500' :
                    isPending ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-base sm:text-lg">Rp {req.amount.toLocaleString('id-ID')}</h4>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5
                        ${isPaid ? 'bg-green-500/20 text-green-400' : 
                          isPending ? 'bg-yellow-500/20 text-yellow-400' :
                          isRejected ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'}`}
                      >
                        {isPaid && <CheckCircle2 className="w-3 h-3" />}
                        {isRejected && <XCircle className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{dateStr}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span>{req.bankName}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span className="font-mono">{req.accountNumber.slice(-4).padStart(req.accountNumber.length, '•')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
