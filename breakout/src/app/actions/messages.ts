"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { uploadFileToAPI } from "@/lib/r2-helpers";
import { sendNewMessageNotification, sendNewMessageNotificationBatch } from "@/lib/email";

const prisma = new PrismaClient();

export async function sendMessageAction(formData: FormData) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: "Unauthorized" };
    }

    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const recipientIds = formData.getAll("recipients") as string[];
    const isBroadcast = formData.get("broadcast") === "true";
    const attachment = formData.get("attachment") as File | null;

    if (!subject || !body) {
      return { error: "Subject and body are required." };
    }

    if (!isBroadcast && recipientIds.length === 0) {
      return { error: "Please select at least one recipient." };
    }

    let attachmentUrl = null;
    let fileName = null;

    if (attachment && attachment.size > 0) {
      console.log("=== UPLOADING MESSAGE ATTACHMENT ===");
      console.log("File:", attachment.name, attachment.type, `${Math.round(attachment.size / 1024)}KB`);
      
      const uploadResult = await uploadFileToAPI(attachment, 'message');
      
      if (!uploadResult.success) {
        return { error: `Failed to upload attachment: ${uploadResult.error}` };
      }

      attachmentUrl = uploadResult.url!;
      fileName = attachment.name;
      console.log("Message attachment uploaded:", attachmentUrl);
    }

    let finalRecipientIds: string[] = [];

    if (isBroadcast) {
      const allUsers = await prisma.user.findMany({
        where: { role: 'USER' },
        select: { id: true, email: true, name: true }
      });
      finalRecipientIds = allUsers.map(u => u.id);
    } else {
      finalRecipientIds = recipientIds;
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        subject,
        body,
        attachment: attachmentUrl,
        fileName,
        senderId: session.user.id,
        recipients: {
          create: finalRecipientIds.map(id => ({
            userId: id
          }))
        }
      }
    });

    // Send emails
    const usersToEmail = await prisma.user.findMany({
      where: { id: { in: finalRecipientIds } },
      select: { email: true, name: true }
    });

    // Send emails using Resend Batch API to prevent hanging and rate limits
    await sendNewMessageNotificationBatch(usersToEmail.map(u => ({
      email: u.email,
      name: u.name || "User"
    })), subject);

    return { success: true, messageId: message.id };
  } catch (error: any) {
    console.error("Error sending message:", error);
    return { error: error.message || "Failed to send message" };
  }
}

export async function markMessageReadAction(messageId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await prisma.messageRecipient.update({
      where: {
        messageId_userId: {
          messageId,
          userId: session.user.id
        }
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error marking message as read:", error);
    return { error: error.message || "Failed to mark as read" };
  }
}
