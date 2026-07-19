"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendAccountApprovedEmail, sendAccountRejectedEmail, sendReleaseApprovedEmail, sendReleaseRejectedEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function updateArtistStatusAction(
  userId: string,
  status: "APPROVED" | "REJECTED" | "SUSPENDED",
  userName: string,
  userEmail: string,
  reason: string = ""
) {
  try {
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
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update status" };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reset password" };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await prisma.verificationToken.deleteMany({ where: { email: user.email } });
    }

    await prisma.user.delete({
      where: { id: userId }
    });
    
    revalidatePath("/admin/artists");
    revalidatePath("/admin/registrations");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete user" };
  }
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

export async function resetArtistDataAction(artistId: string) {
  try {
    await prisma.royalty.deleteMany({ where: { artistId } });
    revalidatePath('/admin/artists');
    revalidatePath('/admin/analytics');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to reset artist data' };
  }
}
