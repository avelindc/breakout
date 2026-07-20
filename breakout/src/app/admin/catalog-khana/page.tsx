import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CatalogKhanaAdminClient } from "./CatalogKhanaAdminClient";

const prisma = new PrismaClient();

export default async function AdminCatalogKhanaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== "ADMIN") redirect("/dashboard");

  const initialData = await prisma.catalogKhana.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <CatalogKhanaAdminClient initialData={initialData} />;
}
