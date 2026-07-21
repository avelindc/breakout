"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function saveTelegramSettingsAction(
  enabled: boolean,
  botToken: string,
  chatId: string,
  origin: string
) {
  try {
    // 1. Save to database
    await prisma.settings.upsert({
      where: { key: "telegram_enabled" },
      update: { value: enabled.toString() },
      create: { key: "telegram_enabled", value: enabled.toString(), description: "Enable Telegram Bot Integration" }
    });

    await prisma.settings.upsert({
      where: { key: "telegram_bot_token" },
      update: { value: botToken },
      create: { key: "telegram_bot_token", value: botToken, description: "Telegram Bot Token" }
    });

    await prisma.settings.upsert({
      where: { key: "telegram_chat_id" },
      update: { value: chatId },
      create: { key: "telegram_chat_id", value: chatId, description: "Telegram Chat ID" }
    });

    // 2. Register Webhook if enabled and bot token is provided
    if (enabled && botToken && origin) {
      const webhookUrl = `${origin}/api/telegram/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
      const data = await res.json();
      if (!data.ok) {
        console.error("Failed to set webhook:", data);
        return { error: `Failed to register webhook: ${data.description}` };
      }
    } else if (!enabled && botToken) {
      // Optional: Delete webhook if disabled
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving telegram settings:", error);
    return { error: error.message || "Failed to save settings" };
  }
}

export async function getTelegramSettingsAction() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: { in: ["telegram_enabled", "telegram_bot_token", "telegram_chat_id"] }
      }
    });

    let enabled = false;
    let botToken = "";
    let chatId = "";

    settings.forEach(s => {
      if (s.key === "telegram_enabled") enabled = s.value === "true";
      if (s.key === "telegram_bot_token") botToken = s.value;
      if (s.key === "telegram_chat_id") chatId = s.value;
    });

    return { data: { enabled, botToken, chatId } };
  } catch (error) {
    return { error: "Failed to load settings" };
  }
}

export async function testTelegramConnectionAction(botToken: string, chatId: string) {
  try {
    if (!botToken || !chatId) {
      return { error: "Bot Token and Chat ID are required." };
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "👋 Halo! Ini adalah pesan percobaan dari sistem CMS. Integrasi Telegram Bot berhasil terhubung!",
      })
    });

    const data = await res.json();

    if (!data.ok) {
      return { error: `Telegram API Error: ${data.description}` };
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to send test message" };
  }
}
