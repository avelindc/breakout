"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendAccountApprovedEmail, sendAccountRejectedEmail, sendReleaseApprovedEmail, sendReleaseRejectedEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function updateArtistStatusAction(
  userId: string,
  status: "APPROVED" | "REJECTED" | "SUSPENDED",
  userName: string,
  userEmail: string,
  reason: string = ""
) {
  await prisma.user.update({
    where: { id: userId },
    data: { 
      status,
      ...(status === "REJECTED" ? { rejectionReason: reason } : {})
    }
  });

  await prisma.notification.create({
    data: {
      userId,
      title: "Account Status Updated",
      message: `Your account has been ${status.toLowerCase()}.${reason ? ' Reason: ' + reason : ''}`
    }
  });

  if (status === "APPROVED") {
    await sendAccountApprovedEmail(userEmail, userName);
  } else if (status === "REJECTED") {
    await sendAccountRejectedEmail(userEmail, userName, reason);
  }

  revalidatePath("/admin/artists");
}

export async function updateReleaseStatusAction(
  releaseId: string,
  artistUserId: string,
  status: "APPROVED" | "REJECTED",
  userName: string,
  userEmail: string,
  title: string,
  reason: string = ""
) {
  await prisma.release.update({
    where: { id: releaseId },
    data: { status }
  });

  await prisma.notification.create({
    data: {
      userId: artistUserId,
      title: `Release ${status}`,
      message: `Your release "${title}" has been ${status.toLowerCase()}.${reason ? ' Reason: ' + reason : ''}`
    }
  });

  if (status === "APPROVED") {
    await sendReleaseApprovedEmail(userEmail, userName, title);
  } else if (status === "REJECTED") {
    await sendReleaseRejectedEmail(userEmail, userName, title, reason);
  }

  revalidatePath("/admin/releases");
  revalidatePath("/dashboard/releases");
}
