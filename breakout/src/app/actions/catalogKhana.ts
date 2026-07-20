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

export async function addCatalogKhana(data: {
  songId?: string | null;
  title: string;
  composer: string;
  publisher?: string | null;
  performer: string;
  youtubeUrl?: string | null;
  coverUrl?: string | null;
}) {
  await requireAdmin();
  return await prisma.catalogKhana.create({ data });
}

export async function updateCatalogKhana(
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
  return await prisma.catalogKhana.update({
    where: { id },
    data,
  });
}

export async function deleteCatalogKhana(id: string) {
  await requireAdmin();
  return await prisma.catalogKhana.delete({
    where: { id },
  });
}
