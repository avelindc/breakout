"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markMessageReadAction } from "@/app/actions/messages";
import { Mail, MailOpen, Paperclip, Clock, X, Download } from "lucide-react";

export function InboxMessageList({ messages }: { messages: any[] }) {
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  const handleOpenMessage = async (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      await markMessageReadAction(msg.messageId);
      router.refresh(); // Refresh to update the read status in the list
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <MailOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No messages</h3>
            <p className="text-gray-500">You're all caught up. No new messages from Admin.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={`p-5 flex items-start gap-4 cursor-pointer transition ${msg.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isRead ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                  {msg.isRead ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-base truncate pr-4 ${msg.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                      {msg.message.subject}
                    </h4>
                    <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.message.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${msg.isRead ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                      {msg.message.body}
                    </p>
                    {msg.message.attachment && (
                      <Paperclip className={`w-4 h-4 ml-2 flex-shrink-0 ${msg.isRead ? 'text-gray-400' : 'text-blue-500'}`} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedMessage.message.subject}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium">From: BREAKOUT Admin</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(selectedMessage.message.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMessage(null)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap">
                {selectedMessage.message.body}
              </div>
              
              {selectedMessage.message.attachment && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Attachment</h4>
                  <a 
                    href={selectedMessage.message.attachment} 
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition group"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col pr-4">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700">{selectedMessage.message.fileName || "Download Attachment"}</span>
                    </div>
                    <div className="ml-auto p-2 bg-white rounded-lg text-gray-400 group-hover:text-blue-600 shadow-sm">
                      <Download className="w-4 h-4" />
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
