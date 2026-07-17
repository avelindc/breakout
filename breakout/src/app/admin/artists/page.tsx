import { PrismaClient } from "@prisma/client";
import { Check, X, Ban, Settings } from "lucide-react";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export default async function AdminArtistsPage() {
  const pendingUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'PENDING' },
    include: { artists: true },
    orderBy: { createdAt: 'desc' }
  });
  
  const approvedUsers = await prisma.user.findMany({
    where: { role: 'USER', status: 'APPROVED' },
    include: { artists: true },
    orderBy: { createdAt: 'desc' }
  });

  async function updateStatusAction(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const status = formData.get("status") as any;

    await prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    await prisma.notification.create({
      data: {
        userId,
        title: "Account Status Updated",
        message: `Your account has been ${status.toLowerCase()}.`
      }
    });

    revalidatePath("/admin/artists");
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Artist Approvals</h1>
        <p className="text-gray-500 text-sm">{pendingUsers.length + approvedUsers.length} users found</p>

        <div className="flex items-center gap-6 mt-8 border-b border-gray-100 pb-4">
          <button className="text-gray-900 font-bold border-b-2 border-blue-600 pb-4 -mb-[18px]">Pending</button>
          <button className="text-gray-400 font-medium pb-4 -mb-[18px]">Approved</button>
        </div>

        <div className="mt-8 overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[900px] space-y-3">
            {/* Table Header */}
            <div className="flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="w-20">Id</div>
              <div className="flex-1">Name / Primary Artist</div>
              <div className="flex-1">Email</div>
              <div className="w-32">Date</div>
              <div className="w-32">Status</div>
              <div className="w-32 flex justify-end">Action</div>
            </div>

            {/* Pending Rows */}
            {pendingUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition hover:bg-blue-600 hover:border-blue-600 hover:shadow-blue-500/20 group cursor-pointer"
              >
                <div className="w-20 text-gray-500 font-medium text-sm group-hover:text-blue-100">
                  #{user.id.slice(-4).toUpperCase()}
                </div>
                
                <div className="flex-1 flex items-center gap-3 pr-4">
                  <img src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile" className="w-8 h-8 rounded-full bg-gray-100 object-cover flex-shrink-0" />
                  <span className="font-bold text-gray-900 group-hover:text-white transition truncate">{user.artists?.[0]?.stageName || user.name}</span>
                </div>
                
                <div className="flex-1 text-gray-500 text-sm group-hover:text-blue-100 pr-4 truncate">
                  {user.email}
                </div>
                
                <div className="w-32 text-gray-500 text-sm group-hover:text-blue-100">
                  {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                
                <div className="w-32 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 group-hover:bg-red-300"></span>
                  <span className="text-red-400 font-medium text-sm group-hover:text-red-300">Pending</span>
                </div>
                
                <div className="w-32 flex justify-end gap-2">
                  <form action={updateStatusAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button type="submit" title="Approve" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 group-hover:text-white group-hover:hover:bg-white/20 transition">
                      <Check className="w-4 h-4" />
                    </button>
                  </form>
                  <form action={updateStatusAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button type="submit" title="Reject" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 group-hover:text-white group-hover:hover:bg-white/20 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {/* Approved Rows */}
            {approvedUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition hover:bg-blue-600 hover:border-blue-600 hover:shadow-blue-500/20 group cursor-pointer"
              >
                <div className="w-20 text-gray-500 font-medium text-sm group-hover:text-blue-100">
                  #{user.id.slice(-4).toUpperCase()}
                </div>
                
                <div className="flex-1 flex items-center gap-3 pr-4">
                  <img src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile" className="w-8 h-8 rounded-full bg-gray-100 object-cover flex-shrink-0" />
                  <span className="font-bold text-gray-900 group-hover:text-white transition truncate">{user.artists?.[0]?.stageName || user.name}</span>
                </div>
                
                <div className="flex-1 text-gray-500 text-sm group-hover:text-blue-100 pr-4 truncate">
                  {user.email}
                </div>
                
                <div className="w-32 text-gray-500 text-sm group-hover:text-blue-100">
                  {new Date(user.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                
                <div className="w-32 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:bg-green-300"></span>
                  <span className="text-green-500 font-medium text-sm group-hover:text-green-300">Approved</span>
                </div>
                
                <div className="w-32 flex justify-end gap-2">
                  <form action={updateStatusAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="status" value="SUSPENDED" />
                    <button type="submit" title="Suspend" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 group-hover:text-white group-hover:hover:bg-white/20 transition">
                      <Ban className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
