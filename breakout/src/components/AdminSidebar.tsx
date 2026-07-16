"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, Music, CheckCircle, BarChart, 
  DollarSign, Settings, LayoutDashboard 
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Artist Approval", href: "/admin/artists", icon: Users },
  { name: "Music Review", href: "/admin/releases", icon: CheckCircle },
  { name: "Royalties", href: "/admin/royalties", icon: DollarSign },
  { name: "Withdrawals", href: "/admin/withdrawals", icon: DollarSign },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-blue-600 flex flex-col h-full fixed top-0 left-0 shadow-2xl z-50 rounded-br-3xl">
      <div className="h-20 flex items-center px-8">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tighter text-white">BREAKOUT.ID</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 pl-4 flex flex-col gap-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
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
                  <div className="absolute -top-4 right-0 w-4 h-4 bg-transparent shadow-[4px_4px_0_4px_#f9fafb] rounded-br-full pointer-events-none"></div>
                  <div className="absolute -bottom-4 right-0 w-4 h-4 bg-transparent shadow-[4px_-4px_0_4px_#f9fafb] rounded-tr-full pointer-events-none"></div>
                </>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-6">
        <SignOutButton />
      </div>
    </aside>
  );
}
