"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Music, User, UploadCloud, Disc, BarChart2, 
  DollarSign, CreditCard, Bell, Settings, LogOut, Menu, X, Mail
} from "lucide-react";
import { signOut } from "next-auth/react";

const links = [
  { name: "Streaming Analytics", href: "/dashboard", icon: BarChart2 },
  { name: "Inbox", href: "/dashboard/inbox", icon: Mail },
  { name: "Upload Music", href: "/dashboard/upload", icon: UploadCloud },
  { name: "My Releases", href: "/dashboard/releases", icon: Disc },
  { name: "Royalties", href: "/dashboard/royalties", icon: DollarSign },
  { name: "Withdraw", href: "/dashboard/withdraw", icon: CreditCard },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ brandLogo = "/logo.png" }: { brandLogo?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <img src={brandLogo} alt="Breakout Logo" className="w-8 h-8 object-contain invert" />
          <span className="font-bold tracking-tighter text-blue-600">BREAKOUT.ID</span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`w-64 bg-blue-600 flex flex-col h-full fixed top-0 left-0 shadow-2xl z-50 rounded-br-3xl transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="h-20 flex items-center justify-between px-8">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <img src={brandLogo} alt="Breakout Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl tracking-tighter text-white">BREAKOUT.ID</span>
          </Link>
          <button 
            className="md:hidden text-white/80 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 pl-4 flex flex-col gap-2 mt-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 pl-6 py-3.5 transition font-medium text-sm relative ${
                  isActive 
                    ? "bg-gray-50 text-blue-600 rounded-l-full" 
                    : "text-blue-100 hover:text-white hover:bg-white/10 rounded-l-full"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
                
                {/* Fake inner shadow elements to simulate the inverted border radius effect */}
                {isActive && (
                  <>
                    <div className="absolute -top-4 right-0 w-4 h-4 bg-transparent shadow-[4px_4px_0_4px_#f9fafb] rounded-br-full pointer-events-none hidden md:block"></div>
                    <div className="absolute -bottom-4 right-0 w-4 h-4 bg-transparent shadow-[4px_-4px_0_4px_#f9fafb] rounded-tr-full pointer-events-none hidden md:block"></div>
                  </>
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-blue-500 flex justify-center">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-700/50 text-blue-100 font-semibold hover:bg-blue-800 hover:text-white transition w-full"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
