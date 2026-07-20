"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

// Only Admins can modify the catalog
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
}

export async function getCatalogRph() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  return await prisma.catalogRph.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function addCatalogRph(data: {
  title: string;
  singer: string;
  composer: string;
  youtubeUrl?: string | null;
  coverUrl?: string | null;
}) {
  await requireAdmin();
  return await prisma.catalogRph.create({ data });
}

export async function updateCatalogRph(
  id: string,
  data: {
    title: string;
    singer: string;
    composer: string;
    youtubeUrl?: string | null;
    coverUrl?: string | null;
  }
) {
  await requireAdmin();
  return await prisma.catalogRph.update({
    where: { id },
    data,
  });
}

export async function deleteCatalogRph(id: string) {
  await requireAdmin();
  return await prisma.catalogRph.delete({
    where: { id },
  });
}
