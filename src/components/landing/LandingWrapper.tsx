"use client";

import React from "react";

export function LandingWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen">
      {children}
    </div>
  );
}
