import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // @ts-ignore
  if (session.user.role !== 'ADMIN') {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
