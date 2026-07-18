"use client";

import { useEffect, useState } from "react";

export function MaintenanceClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm font-bold text-white/90 mt-0.5 min-h-[20px]">
      {time || "--:--:--"}
    </div>
  );
}
