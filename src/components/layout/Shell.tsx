"use client";

import { useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LeagueChat } from "@/components/dashboard/LeagueChat";
import { MessageSquare, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

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

      {/* Floating Chat Toggle (Desktop) */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={cn(
          "hidden md:flex fixed bottom-8 right-8 z-[100] w-14 h-14 rounded-full bg-primary text-black items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all",
          isChatOpen && "rotate-90 bg-white/10 text-white border border-white/10"
        )}
      >
        {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Drawer (Desktop) */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-screen w-96 z-[90] bg-black/40 backdrop-blur-3xl border-l border-white/10 shadow-2xl transition-transform duration-500 ease-in-out transform",
          isChatOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 h-full pt-20 md:pt-4">
          {activeLeague?.id && (
            <LeagueChat leagueId={activeLeague.id} currentUserId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}
