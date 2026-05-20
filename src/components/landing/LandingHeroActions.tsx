import React from "react";
import Link from "next/link";
import { Play, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export async function LandingHeroActions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let hasLeague = false;
  let isSuperAdmin = false;
  
  if (user) {
    isSuperAdmin = user.user_metadata?.role === 'super_admin';
    const { data: membership } = await supabase
      .from('league_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    hasLeague = !!membership;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
      {user ? (
        <Link 
          href={isSuperAdmin ? "/hq" : (hasLeague ? "/dashboard" : "/paywall")} 
          className="px-8 py-4 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:translate-y-[-2px] hover:shadow-[0_15px_45px_rgba(251,191,36,0.45)] hover:scale-[1.02] transition-all group w-full sm:w-auto justify-center cursor-pointer"
        >
          {isSuperAdmin ? "Entrar al HQ" : (hasLeague ? "Entrar a mi Liga" : "Activar mi Liga")}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <Link href="/login?mode=register" className="px-8 py-4 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:translate-y-[-2px] hover:shadow-[0_15px_45px_rgba(251,191,36,0.45)] hover:scale-[1.02] transition-all group w-full sm:w-auto justify-center cursor-pointer">
          Armá tu Liga
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
      <Link href="/demo" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center gap-3 backdrop-blur-md hover:bg-white/10 transition-all w-full sm:w-auto justify-center cursor-pointer">
        <Play className="w-4 h-4 fill-white" />
        Explorar Demo
      </Link>
    </div>
  );
}

export function LandingHeroActionsFallback() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full animate-pulse">
      <div className="w-48 h-12 bg-white/5 border border-white/10 rounded-2xl" />
      <div className="w-48 h-12 bg-white/5 border border-white/10 rounded-2xl" />
    </div>
  );
}
