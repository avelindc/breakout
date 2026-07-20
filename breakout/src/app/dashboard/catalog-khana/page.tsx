import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CatalogKhanaClient } from "./CatalogKhanaClient";

const prisma = new PrismaClient();

export default async function UserCatalogKhanaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const catalog = await prisma.catalogKhana.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <CatalogKhanaClient data={catalog} />;
}
