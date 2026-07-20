import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CatalogHaloAdminClient } from "./CatalogHaloAdminClient";

const prisma = new PrismaClient();

export default async function AdminCatalogHaloPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== "ADMIN") redirect("/dashboard");

  // Only fetch latest 1000 to prevent payload too large error.
  const initialData = await prisma.catalogHalo.findMany({
    take: 1000,
    orderBy: { createdAt: "desc" },
  });

  return <CatalogHaloAdminClient initialData={initialData} />;
}
