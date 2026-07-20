"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Music, User, UploadCloud, Disc, BarChart2, LineChart, Activity,
  DollarSign, CreditCard, Bell, Settings, LogOut, Menu, X, Mail, Library, FileText, BookOpen
} from "lucide-react";
import { signOut } from "next-auth/react";

const links = [
  { name: "Dasbor",                href: "/dashboard",            icon: BarChart2  },
  { name: "Analytics Streaming",   href: "/dashboard/streaming",  icon: Activity   },
  { name: "Analytics",             href: "/dashboard/analytics",  icon: LineChart  },
  { name: "Inbox", href: "/dashboard/inbox", icon: Mail },
  { name: "Katalog Musik", href: "/dashboard/catalog", icon: Library },
  { name: "Katalog RPH", href: "/dashboard/catalog-rph", icon: Library },
  { name: "Katalog Khana", href: "/dashboard/catalog-khana", icon: Library },
  { name: "Katalog Halo", href: "/dashboard/catalog-halo", icon: Library },
  { name: "Publisher Catalog", href: "/dashboard/publisher-catalog", icon: BookOpen },
  { name: "Upload Music", href: "/dashboard/upload", icon: UploadCloud },
  { name: "My Releases", href: "/dashboard/releases", icon: Disc },
  { name: "Royalties", href: "/dashboard/royalties", icon: DollarSign },
  { name: "Royalty Per Song", href: "/dashboard/royalty-per-song", icon: DollarSign },
  { name: "Withdraw", href: "/dashboard/withdraw", icon: CreditCard },
  { name: "Kontrak Saya", href: "/dashboard/contracts", icon: FileText },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

// macOS Dock-style wave effect: returns scale based on distance from hovered index
function getScale(hoveredIndex: number | null, currentIndex: number): number {
  if (hoveredIndex === null) return 1;
  const distance = Math.abs(hoveredIndex - currentIndex);
  if (distance === 0) return 1.12;
  if (distance === 1) return 1.06;
  if (distance === 2) return 1.02;
  return 1;
}

export function DashboardSidebar({ brandLogo = "/logo.png" }: { brandLogo?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 fundflow-glass border-b border-white/20 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <img src={brandLogo} alt="Breakout Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold tracking-tighter text-gray-900 drop-shadow-sm">BREAKOUT.ID</span>
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
          className="md:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`w-64 fundflow-glass flex flex-col h-full fixed top-0 left-0 z-50 transition-transform duration-300 ease-in-out border-r border-white/50
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="h-24 flex items-center justify-between px-8">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <img src={brandLogo} alt="Breakout Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl tracking-tighter text-gray-900">BREAKOUT</span>
          </Link>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-900"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 font-medium text-sm rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? "bg-white/60 text-blue-700 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/80" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/30"
                }`}
              >
                <div className={`${isActive ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400'} p-1.5 rounded-xl transition-colors`}>
                  <Icon className="w-4 h-4" />
                </div>
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-white/20 flex justify-center">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/50 text-gray-700 font-semibold hover:bg-white border border-white/60 transition w-full shadow-[0_4px_15px_rgba(0,0,0,0.02)]"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
