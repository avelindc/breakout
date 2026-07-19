"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, Music, CheckCircle, BarChart, Activity,
  DollarSign, Settings, LayoutDashboard, Menu, X, Mail, Library, BookOpen, Disc, Globe
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { name: "Overview",           href: "/admin",            icon: LayoutDashboard },
  { name: "Streaming Analytics", href: "/admin/streaming",  icon: Activity },
  { name: "Website CMS",        href: "/admin/website-cms", icon: Globe },
  { name: "Katalog Musik", href: "/admin/catalog", icon: Library },
  { name: "Publisher Catalog", href: "/admin/publisher-catalog", icon: BookOpen },
  { name: "Message Center", href: "/admin/messages", icon: Mail },
  { name: "Identity Verif", href: "/admin/registrations", icon: CheckCircle },
  { name: "Music Review", href: "/admin/releases", icon: CheckCircle },
  { name: "My Releases", href: "/admin/my-releases", icon: Music },
  { name: "Existing Release", href: "/admin/existing-releases", icon: Disc },
  { name: "Artists", href: "/admin/all-artists", icon: Users },
  { name: "Royalties", href: "/admin/royalties", icon: DollarSign },
  { name: "Withdrawals", href: "/admin/withdrawals", icon: DollarSign },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
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

export function AdminSidebar({ artists = [], brandLogo = "/logo.png" }: { artists?: any[], brandLogo?: string }) {
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
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
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

        <div className="flex-1 overflow-y-auto py-6 pb-24 px-4 flex flex-col gap-2">
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

        <div className="p-6">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
