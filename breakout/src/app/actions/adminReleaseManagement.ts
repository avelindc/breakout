"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function adminTakedownReleaseAction(releaseId: string) {
  try {
    await prisma.release.update({
      where: { id: releaseId },
      data: { status: "REJECTED" }, // Reverted / Takedown
    });

    revalidatePath("/admin/releases");
    revalidatePath("/admin/my-releases");
    revalidatePath("/dashboard/releases");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to takedown release" };
  }
}

export async function adminEditReleaseAction(releaseId: string, data: { title: string; genre: string; upc?: string; isrc?: string }) {
  try {
    const release = await prisma.release.update({
      where: { id: releaseId },
      data: {
        title: data.title,
        genre: data.genre,
        upc: data.upc || null,
        tracks: {
          updateMany: {
            where: { releaseId },
            data: {
              title: data.title,
              isrc: data.isrc || null,
              upc: data.upc || null,
            }
          }
        }
      }
    });

    revalidatePath("/admin/releases");
    revalidatePath("/admin/my-releases");
    revalidatePath("/dashboard/releases");
    return { success: true, release };
  } catch (err: any) {
    return { error: err.message || "Failed to update release details" };
  }
}
