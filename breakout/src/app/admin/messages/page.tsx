import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import Link from "next/link";
import { Mail, Plus, Eye, Clock, Users, Paperclip } from "lucide-react";

const prisma = new PrismaClient();

export default async function AdminMessagesPage() {
  const session = await auth();

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      recipients: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Message Center</h1>
          <p className="text-gray-500">Send and manage announcements or direct messages to artists.</p>
        </div>
        <Link 
          href="/admin/messages/compose"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Compose Message
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No messages sent</h3>
            <p className="text-gray-500 mb-6">You haven't sent any messages yet.</p>
            <Link 
              href="/admin/messages/compose"
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Send your first message
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold">Recipients</th>
                  <th className="px-6 py-4 font-semibold text-center">Read Status</th>
                  <th className="px-6 py-4 font-semibold">Date Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {messages.map((message) => {
                  const total = message.recipients.length;
                  const readCount = message.recipients.filter(r => r.isRead).length;
                  const readPercentage = total > 0 ? Math.round((readCount / total) * 100) : 0;
                  
                  return (
                    <tr key={message.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                          {message.subject}
                          {message.attachment && (
                            <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {message.body.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users className="w-4 h-4 text-gray-400" />
                          {total === 0 ? "None" : total > 1 ? `${total} Artists` : message.recipients[0]?.user?.name || "1 Artist"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold text-gray-900">{readCount} / {total}</span>
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${readPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${readPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {new Date(message.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
