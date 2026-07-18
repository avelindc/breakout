import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function isMaintenanceActive(): Promise<boolean> {
  try {
    const activeSetting = await prisma.settings.findUnique({
      where: { key: "maintenance_active" }
    });

    if (activeSetting?.value !== "true") {
      return false;
    }

    const startSetting = await prisma.settings.findUnique({
      where: { key: "maintenance_start" }
    });
    const endSetting = await prisma.settings.findUnique({
      where: { key: "maintenance_end" }
    });

    const now = new Date();

    if (startSetting?.value) {
      const startTime = new Date(startSetting.value);
      if (now < startTime) {
        return false;
      }
    }

    if (endSetting?.value) {
      const endTime = new Date(endSetting.value);
      if (now >= endTime) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking maintenance status:", error);
    return false;
  }
}

export async function getMaintenanceData() {
  try {
    const keys = [
      "maintenance_active",
      "maintenance_title",
      "maintenance_message",
      "maintenance_start",
      "maintenance_end",
      "maintenance_type"
    ];

    const settings = await prisma.settings.findMany({
      where: { key: { in: keys } }
    });

    const data: Record<string, string> = {
      maintenance_active: "false",
      maintenance_title: "Mohon Maaf",
      maintenance_message: "Dashboard sedang tidak dapat diakses.",
      maintenance_start: "",
      maintenance_end: "",
      maintenance_type: "system"
    };

    settings.forEach((s) => {
      data[s.key] = s.value;
    });

    return data;
  } catch (error) {
    console.error("Error getting maintenance data:", error);
    return {
      maintenance_active: "false",
      maintenance_title: "Mohon Maaf",
      maintenance_message: "Dashboard sedang tidak dapat diakses.",
      maintenance_start: "",
      maintenance_end: "",
      maintenance_type: "system"
    };
  }
}
