import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CatalogHaloClient } from "./CatalogHaloClient";

const prisma = new PrismaClient();

export default async function UserCatalogHaloPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Only fetch 1000 items initially to prevent large payload size issues on edge functions.
  const catalog = await prisma.catalogHalo.findMany({
    take: 1000,
    orderBy: { createdAt: "desc" },
  });

  return <CatalogHaloClient data={catalog} />;
}
