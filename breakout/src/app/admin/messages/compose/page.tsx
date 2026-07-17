import { PrismaClient } from "@prisma/client";
import { MessageComposeForm } from "@/components/MessageComposeForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const prisma = new PrismaClient();

export default async function AdminComposeMessagePage() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <Link href="/admin/messages" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Message Center
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compose Message</h1>
        <p className="text-gray-500">Send an announcement or direct message to artists.</p>
      </div>

      <MessageComposeForm users={users} />
    </div>
  );
}
