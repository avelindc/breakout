"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MaintenancePoller() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/maintenance") return;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/maintenance", { 
          cache: "no-store",
          headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" }
        });
        const data = await res.json();
        if (data?.active) {
          window.location.href = "/maintenance";
        }
      } catch (err) {
        console.error("Client maintenance check failed:", err);
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
