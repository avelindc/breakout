import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { InboxMessageList } from "@/components/InboxMessageList";

const prisma = new PrismaClient();

export default async function UserInboxPage() {
  const session = await auth();

  const receivedMessages = await prisma.messageRecipient.findMany({
    where: { userId: session?.user?.id },
    include: {
      message: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inbox</h1>
        <p className="text-gray-500">Messages and announcements from BREAKOUT Admin.</p>
      </div>

      <InboxMessageList messages={receivedMessages} />
    </div>
  );
}
