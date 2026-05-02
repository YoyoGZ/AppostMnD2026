"use client";

import React from "react";
import { User, Shield, Trophy, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { getLeagueDuelsAction } from "@/app/actions/duels";
import { DuelChronicles } from "@/components/duels/DuelChronicles";

export default function ProfilePage() {
  const [alias, setAlias] = useState<string>("Cargando...");
  const [email, setEmail] = useState<string>("");
  const [leagueName, setLeagueName] = useState<string>("La Arena");
  const [duelsWon, setDuelsWon] = useState<number>(0);
  const [duels, setDuels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAlias(user.user_metadata?.display_name || user.email?.split("@")[0] || "Gladiador");
          setEmail(user.email || "");

          const activeLeagueId = user.user_metadata?.active_league_id;
          if (activeLeagueId) {
            // 1. Obtener Duelos
            const result = await getLeagueDuelsAction(activeLeagueId);
            if (result.success && result.duels) {
              setDuels(result.duels);
            }
            
            // 2. Obtener Nombre de la Liga y Victorias
            const { data: member } = await supabase
              .from('league_members')
              .select('duelos_ganados, leagues(name)')
              .eq('user_id', user.id)
              .eq('league_id', activeLeagueId)
              .single();
            
            if (member) {
              setDuelsWon(member.duelos_ganados || 0);
              if (member.leagues && (member.leagues as any).name) {
                setLeagueName((member.leagues as any).name);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [supabase]);

  return (
    <div className="relative pb-24">
      <header className="mb-8 pt-4 md:pt-0 relative z-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(251,191,36,0.15)]">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-1 text-white uppercase italic">
          {alias}
        </h2>
        <p className="text-primary/80 text-[10px] font-black uppercase tracking-[0.3em]">
          Gladiador Legendario
        </p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        
        <aside className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Identidad</h3>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Email</p>
                <p className="text-sm text-white font-bold truncate max-w-[150px]">{email || "Anónimo"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Duelos Ganados</p>
                <p className="text-sm text-white font-bold">{duelsWon} Victorias</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-2xl p-5">
            <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Arena Activa</p>
            <p className="text-lg font-black text-white leading-tight">{leagueName}</p>
          </div>
        </aside>

        <main className="md:col-span-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Abriendo Crónicas...</p>
            </div>
          ) : (
            <DuelChronicles duels={duels} totalWins={duelsWon} />
          )}
        </main>
      </div>
    </div>
  );
}
