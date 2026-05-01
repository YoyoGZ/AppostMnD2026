"use client";

import { useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export function Shell({ 
  children, 
  activeLeague, 
  allLeagues 
}: { 
  children: React.ReactNode, 
  activeLeague?: { id: string, name: string, isCaptain: boolean },
  allLeagues?: { id: string, name: string, isCaptain: boolean }[]
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <div className="bg-stadium" />
      <Sidebar activeLeague={activeLeague} allLeagues={allLeagues} />
      <main 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out scroll-smooth pt-14 md:pt-0",
          // Respetamos el ancho dinámico del sidebar fixed (Desktop)
          "md:pl-[256px]", 
          isCollapsed && "md:pl-[80px]"
        )}
      >
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
        {/* Espaciador inferior para Mobile Bottom Nav */}
        <div className="h-20 md:hidden" />
      </main>
    </div>
  );
}
