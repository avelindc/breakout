import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Force dynamic so Next.js doesn't cache this route
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Check if it's a callback query (button click)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const data = callbackQuery.data; // e.g. "take_cuid" or "rej_cuid"
      const message = callbackQuery.message;

      if (!data) {
        return NextResponse.json({ ok: true });
      }

      const action = data.substring(0, 4); // "take" or "rej_"
      const releaseId = data.substring(5);

      // Get bot token from settings to send replies
      const tokenSetting = await prisma.settings.findUnique({
        where: { key: 'telegram_bot_token' }
      });
      const botToken = tokenSetting?.value;

      let newStatus = "";
      let statusText = "";

      if (action === "take") {
        newStatus = "APPROVED"; // Approved
        statusText = "✅ Disetujui (APPROVED)";
      } else if (action === "rej_") {
        newStatus = "REJECTED"; // Rejected
        statusText = "❌ Ditolak (REJECTED)";
      }

      if (newStatus && releaseId) {
        // Update release status in DB
        await prisma.release.update({
          where: { id: releaseId },
          data: { status: newStatus as any }
        });

        // Revalidate the entire application layout to clear client router cache
        revalidatePath("/", "layout");

        if (botToken) {
          // 1. Answer the callback query to stop the loading spinner on the button
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: `Status Release diperbarui: ${newStatus}`,
              show_alert: false
            })
          });

          // 2. Edit the original message to remove the buttons and show who took it
          const newCaption = `${message.caption || ''}\n\n*Status:* ${statusText} oleh ${callbackQuery.from.first_name || 'Admin'}`;
          
          await fetch(`https://api.telegram.org/bot${botToken}/editMessageCaption`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: message.chat.id,
              message_id: message.message_id,
              caption: newCaption,
              parse_mode: "Markdown",
              reply_markup: { inline_keyboard: [] } // Remove buttons
            })
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    // Always return 200 to Telegram so they don't retry unnecessarily
    return NextResponse.json({ ok: true, error: "Internal Server Error" });
  }
}
