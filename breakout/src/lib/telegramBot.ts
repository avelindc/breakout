import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function sendTelegramReleaseNotification(
  releaseId: string, 
  artistName: string, 
  title: string, 
  userEmail: string, 
  releaseDateStr: string,
  coverUrl: string,
  audioUrl: string,
  upc: string,
  isrc: string
) {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: { in: ['telegram_enabled', 'telegram_bot_token', 'telegram_chat_id'] }
      }
    });

    let enabled = false;
    let botToken = "";
    let chatId = "";

    settings.forEach(s => {
      if (s.key === 'telegram_enabled') enabled = s.value === 'true';
      if (s.key === 'telegram_bot_token') botToken = s.value;
      if (s.key === 'telegram_chat_id') chatId = s.value;
    });

    if (!enabled || !botToken || !chatId) {
      return; // Telegram not enabled or configured properly
    }

    const message = `🎵 *New Release Submitted!*\n\n*Artist:* ${artistName}\n*Title:* ${title}\n*Submitter:* ${userEmail}\n*Release Date:* ${releaseDateStr}\n*UPC:* ${upc || '-'}\n*ISRC:* ${isrc || '-'}\n\n[🎧 Download Audio](${audioUrl})`;

    // Get the base URL from the environment or default to something generic for the Admin link
    const baseUrl = process.env.NEXTAUTH_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'https://mmemusic.com');

    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: "👀 Lihat Detail", url: `${baseUrl}/admin/releases/${releaseId}` }],
        [
          { text: "✅ Ambil Release", callback_data: `take_${releaseId}` },
          { text: "❌ Tolak", callback_data: `rej_${releaseId}` }
        ]
      ]
    };

    // Send Photo with caption and inline keyboard
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: coverUrl,
        caption: message,
        parse_mode: "Markdown",
        reply_markup: inlineKeyboard
      })
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("Failed to send Telegram notification:", data);
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}
