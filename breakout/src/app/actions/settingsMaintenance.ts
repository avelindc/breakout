"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function saveMaintenanceSettingsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // @ts-ignore
  if (session.user.role !== "ADMIN") {
    return { error: "Admin access required" };
  }

  try {
    const active = formData.get("active") === "true" ? "true" : "false";
    const title = (formData.get("title") as string) || "Mohon Maaf";
    const message =
      (formData.get("message") as string) ||
      "Maaf, hari ini operasional BREAKOUT.ID sedang libur. Silakan kembali lagi sesuai jadwal yang telah ditentukan.";
    const start = (formData.get("start") as string) || "";
    const end = (formData.get("end") as string) || "";
    const type = (formData.get("type") as string) || "system";

    const settingsData = [
      { key: "maintenance_active", value: active },
      { key: "maintenance_title", value: title },
      { key: "maintenance_message", value: message },
      { key: "maintenance_start", value: start },
      { key: "maintenance_end", value: end },
      { key: "maintenance_type", value: type }
    ];

    for (const setting of settingsData) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value,
          description: `Maintenance setting: ${setting.key}`
        }
      });
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Save maintenance settings error:", error);
    return { error: error.message || "Failed to save maintenance settings" };
  }
}
