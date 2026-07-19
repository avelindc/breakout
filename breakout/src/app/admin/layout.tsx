import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  const artists = await prisma.artist.findMany({
    select: { id: true, stageName: true }
  });

  const brandSetting = await prisma.settings.findUnique({
    where: { key: 'brand_logo' }
  });
  const brandLogo = brandSetting?.value || "/logo.png";

  return (
    <div className="min-h-screen fundflow-bg text-gray-900 flex">
      <AdminSidebar artists={artists} brandLogo={brandLogo} />
      <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto min-h-screen w-full relative z-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
