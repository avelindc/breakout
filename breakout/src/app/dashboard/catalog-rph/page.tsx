import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CatalogRphClient } from "./CatalogRphClient";

const prisma = new PrismaClient();

export default async function UserCatalogRphPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const catalog = await prisma.catalogRph.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <CatalogRphClient data={catalog} />;
}
