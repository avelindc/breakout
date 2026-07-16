import { auth } from "@/auth";

export default async function UserSettingsPage() {
  const session = await auth();

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-gray-400">Manage your profile and security preferences.</p>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input type="email" disabled defaultValue={session?.user?.email || ""} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input type="text" defaultValue={session?.user?.name || ""} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <input type="password" placeholder="Leave blank to keep current password" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition" />
          </div>

          <button type="button" className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7000FF] to-[#0047FF] text-white font-bold hover:opacity-90 transition">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
