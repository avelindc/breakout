"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/20 transition"
    >
      <LogOut className="w-5 h-5" />
      Log Out
    </button>
  );
}
