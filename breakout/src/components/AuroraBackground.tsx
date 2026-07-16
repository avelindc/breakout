"use client";
import React from "react";

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background-dark text-foreground">
      <div className="aurora-bg">
        <div className="aurora-gradient gradient-1" />
        <div className="aurora-gradient gradient-2" />
        <div className="aurora-gradient gradient-3" />
      </div>
      <div className="relative z-10 w-full flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
