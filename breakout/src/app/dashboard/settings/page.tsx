import { auth } from "@/auth";
import { UserSettingsForm } from "@/components/UserSettingsForm";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function UserSettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) return null;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-gray-400">Manage your profile and security preferences.</p>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
        <UserSettingsForm user={user} />
      </div>
    </div>
  );
}
