import { auth } from "@/auth";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

export default async function PendingPage() {
  const session = await auth();

  // @ts-ignore
  if (session?.user?.status === 'APPROVED') {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center p-6">
      <div className="glass-card p-10 rounded-2xl max-w-md text-center">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">Account Pending Approval</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Your artist registration has been received. Our team is currently reviewing your application. You will be able to access the dashboard once your account is approved.
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
