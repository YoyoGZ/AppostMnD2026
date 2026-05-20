import React from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export async function LandingNavActions() {
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
    <div className="flex items-center gap-2 sm:gap-4">
      {user ? (
        <Link 
          href={isSuperAdmin ? "/hq" : (hasLeague ? "/dashboard" : "/paywall")} 
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(251,191,36,0.25)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSuperAdmin ? "Cuartel General" : (hasLeague ? "Mi Dashboard" : "Activar mi Liga")}
        </Link>
      ) : (
        <Link href="/login" className="px-4 py-2 bg-transparent border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/5 hover:border-white/40 transition-colors">
          Ya estoy Registrado
        </Link>
      )}
    </div>
  );
}

export function LandingNavActionsFallback() {
  return (
    <div className="flex items-center gap-2 sm:gap-4 animate-pulse">
      <div className="w-28 h-9 bg-white/5 border border-white/10 rounded-lg" />
    </div>
  );
}
