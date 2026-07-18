import { DashboardSidebar } from "@/components/DashboardSidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { isMaintenanceActive } from "@/lib/maintenance";
import { MaintenancePoller } from "@/components/MaintenancePoller";

const prisma = new PrismaClient();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // @ts-ignore
  if (session.user.role === 'ADMIN') {
    redirect("/admin");
  }

  // Check Maintenance Mode
  const active = await isMaintenanceActive();
  if (active) {
    redirect("/maintenance");
  }

  const brandSetting = await prisma.settings.findUnique({
    where: { key: 'brand_logo' }
  });
  const brandLogo = brandSetting?.value || "/logo.png";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <MaintenancePoller />
      <DashboardSidebar brandLogo={brandLogo} />
      <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto min-h-screen bg-[#f8f9fa] w-full">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
