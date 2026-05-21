"use client";

import { useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { LeagueChat } from "@/components/dashboard/LeagueChat";
import { useAuth } from "@/context/AuthContext";

export function Shell({ 
  children, 
  activeLeague, 
  allLeagues
}: { 
  children: React.ReactNode, 
  activeLeague?: { id: string, name: string, isCaptain: boolean },
  allLeagues?: { id: string, name: string, isCaptain: boolean }[]
}) {
  const { isCollapsed, isChatOpen, setIsChatOpen } = useSidebar();
  const { user } = useAuth();
  const userId = user?.id || null;

  return (
    <div className="flex min-h-screen">
      <div className="bg-stadium" />
      <Sidebar activeLeague={activeLeague} allLeagues={allLeagues} />

      
      <main 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out scroll-smooth pt-14 md:pt-0 overflow-x-hidden",
          "md:pl-[256px]", 
          isCollapsed && "md:pl-[80px]"
        )}
      >
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
        <div className="h-20 md:hidden" />
      </main>

      {/* Chat Drawer */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-screen w-full md:w-96 z-[90] bg-black/90 md:bg-black/40 backdrop-blur-3xl md:border-l border-white/10 shadow-2xl transition-transform duration-500 ease-in-out transform flex flex-col",
          isChatOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-0 md:p-4 h-full md:pt-4">
          {activeLeague?.id && (
            <LeagueChat 
              leagueId={activeLeague.id} 
              currentUserId={userId} 
              onClose={() => setIsChatOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
