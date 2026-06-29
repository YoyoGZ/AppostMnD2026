'use client'
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import knockoutData from '@/data/knockouts-simulation.json';
import worldCupData from '@/data/world-cup-2026.json';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { MatchPredictionCard } from '@/components/tournament/MatchPredictionCard';
import { normalizeFIFAId } from '@/lib/utils/flags';

interface KnockoutMatch {
  id: string | number;
  home_placeholder: string;
  away_placeholder: string;
  fecha?: string;
  estadio?: string;
  estado: string;
}

interface KnockoutRound {
  id: string;
  nombre: string;
  slug: string;
  partidos: KnockoutMatch[];
}

const getTeamName = (teamId: string | null) => {
  if (!teamId || teamId === 'TBD') return null;
  const id = normalizeFIFAId(teamId);
  const team = worldCupData.equipos.find(t => t.id === id);
  return team ? team.nombre : id;
};

export default function KnockoutBracket() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [activeRound, setActiveRound] = useState(knockoutData.rondas[0].id);
  const [dbResults, setDbResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const rounds = knockoutData.rondas as KnockoutRound[];
  const currentRound = rounds.find(r => r.id === activeRound);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchMatchIdentities() {
      const supabase = createClient();
      const { data } = await supabase
        .from('match_results')
        .select('id, home_team_id, away_team_id, status');
      
      if (data) {
        const mapping = data.reduce((acc: any, curr: any) => {
          acc[curr.id.toString()] = curr;
          return acc;
        }, {});

        setDbResults(mapping);
      }
      setIsLoading(false);
    }

    fetchMatchIdentities();
    
    // Suscribirse a cambios en tiempo real
    const channel = createClient()
      .channel('bracket-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' }, () => fetchMatchIdentities())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-primary animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Selector de Rondas (Tabs Premium) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar snap-x scroll-px-4">
        {rounds.map((round) => {
          const isActive = activeRound === round.id;
          return (
            <button
              key={round.id}
              onClick={() => setActiveRound(round.id)}
              className={cn(
                "px-6 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] md:text-xs transition-all snap-start whitespace-nowrap border flex flex-col items-center gap-1 min-w-[140px]",
                isActive 
                  ? "bg-primary text-black border-primary shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] scale-105" 
                  : "bg-white/5 text-white/30 border-white/5 hover:bg-white/10"
              )}
            >
              <span>{round.nombre}</span>
              <span className={cn("text-[8px] opacity-60", isActive ? "text-black" : "text-white/20")}>
                {round.partidos.length} PARTIDOS
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Grid de Partidos de la Ronda */}
      <div className={cn(
        "grid grid-cols-1 gap-6",
        activeRound === 'final' ? "max-w-xl mx-auto" : "md:grid-cols-2 lg:grid-cols-2"
      )}>
        {currentRound?.partidos.map((match) => {
          const realMatch = dbResults[match.id.toString()];
          const homeTeam = realMatch?.home_team_id || null;
          const awayTeam = realMatch?.away_team_id || null;

          const matchInfoForCard = {
            id: match.id.toString(),
            fase: currentRound?.nombre || "Eliminatorias",
            fecha: match.fecha || "",
            home: {
              id: homeTeam || "TBD",
              nombre: getTeamName(homeTeam) || match.home_placeholder || "TBD"
            },
            away: {
              id: awayTeam || "TBD",
              nombre: getTeamName(awayTeam) || match.away_placeholder || "TBD"
            }
          };

          return (
            <div key={match.id} className="w-full">
              {mounted ? (
                <MatchPredictionCard matchInfo={matchInfoForCard} userId={userId} />
              ) : (
                <div className="bento-card w-full shadow-2xl bg-card-body/40 p-0 flex flex-col h-full animate-pulse border-white/5 min-h-[220px]">
                  <div className="bg-card-header/40 px-7 py-4 h-12 border-b border-white/5" />
                  <div className="p-7 flex flex-col gap-5 flex-grow" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center pt-8">
         <div className="flex items-center gap-6 text-[9px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-8 py-3 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> Definido
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" /> Pendiente
            </div>
         </div>
      </div>

    </div>
  );
}
