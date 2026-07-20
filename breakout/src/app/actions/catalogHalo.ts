"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
}

export async function addCatalogHalo(data: {
  songId?: string | null;
  title: string;
  composer: string;
  publisher?: string | null;
  performer: string;
  youtubeUrl?: string | null;
  coverUrl?: string | null;
}) {
  await requireAdmin();
  return await prisma.catalogHalo.create({ data });
}

export async function updateCatalogHalo(
  id: string,
  data: {
    songId?: string | null;
    title: string;
    composer: string;
    publisher?: string | null;
    performer: string;
    youtubeUrl?: string | null;
    coverUrl?: string | null;
  }
) {
  await requireAdmin();
  return await prisma.catalogHalo.update({
    where: { id },
    data,
  });
}

export async function deleteCatalogHalo(id: string) {
  await requireAdmin();
  return await prisma.catalogHalo.delete({
    where: { id },
  });
}
