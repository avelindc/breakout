"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isMaintenanceActive } from "@/lib/maintenance";

const prisma = new PrismaClient();

export async function withdrawAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const active = await isMaintenanceActive();
  if (active && session.user.role !== "ADMIN") {
    return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
  }

  const amount = parseFloat(formData.get("amount") as string);
  const bankName = formData.get("bankName") as string;
  const accountName = formData.get("accountName") as string;
  const accountNumber = formData.get("accountNumber") as string;

  if (!amount || amount < 50 || !bankName || !accountName || !accountNumber) {
    return { error: "Invalid form data or amount too low" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artists: { include: { royalties: true } },
      withdrawRequests: true
    }
  });

  if (!user || user.artists.length === 0) {
    return { error: "User or artists not found" };
  }

  let totalRevenue = 0;
  user.artists.forEach(artist => {
    totalRevenue += artist.royalties.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  });
  
  const totalWithdrawn = user.withdrawRequests.filter(w => w.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingWithdrawal = user.withdrawRequests.filter(w => w.status === 'PENDING' || w.status === 'APPROVED').reduce((acc, curr) => acc + curr.amount, 0);
  
  const availableBalance = totalRevenue - totalWithdrawn - pendingWithdrawal;

  if (amount > availableBalance) {
    return { error: "Insufficient balance" };
  }

  try {
    await prisma.withdrawRequest.create({
      data: {
        userId: user.id,
        amount,
        bankName,
        accountName,
        accountNumber,
        status: "PENDING"
      }
    });

    // Notify Admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId: a.id,
          title: "New Withdrawal Request",
          message: `${user.name || user.email} requested a withdrawal of Rp ${amount.toLocaleString('id-ID')}.`
        }))
      });
    }

    revalidatePath("/dashboard/withdraw");
    revalidatePath("/admin/withdraw");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to submit request" };
  }
}
