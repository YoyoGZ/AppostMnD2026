'use client'
import React, { useState, useEffect } from 'react';
import { Trophy, Lock, Swords, Calendar, MapPin, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import knockoutData from '@/data/knockouts-simulation.json';
import worldCupData from '@/data/world-cup-2026.json';
import { createClient } from '@/utils/supabase/client';

import { getTeamFlagUrl, normalizeFIFAId } from '@/lib/utils/flags';

interface KnockoutMatch {
  id: string;
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
  if (!teamId) return null;
  const id = normalizeFIFAId(teamId);
  const team = worldCupData.equipos.find(t => t.id === id);
  return team ? team.nombre : id;
};

export default function KnockoutBracket() {
  const [activeRound, setActiveRound] = useState(knockoutData.rondas[0].id);
  const [dbResults, setDbResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const rounds = knockoutData.rondas as KnockoutRound[];
  const currentRound = rounds.find(r => r.id === activeRound);

  useEffect(() => {
    async function fetchMatchIdentities() {
      const supabase = createClient();
      const { data } = await supabase
        .from('match_results')
        .select('id, home_team_id, away_team_id, status');
      
      if (data) {
        const mapping = data.reduce((acc: any, curr) => {
          acc[curr.id.toString()] = curr;
          return acc;
        }, {});
        setDbResults(mapping);
      }
      setIsLoading(false);
    }

    fetchMatchIdentities();
    // Suscribirse a cambios en tiempo real para que el bracket se actualice solo
    const channel = createClient()
      .channel('bracket-updates')
      .on('postgres_changes', { event: '*', table: 'match_results' }, () => fetchMatchIdentities())
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
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      
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
        "grid grid-cols-1 gap-6 animate-in fade-in duration-700",
        activeRound === 'final' ? "max-w-4xl mx-auto" : "md:grid-cols-2 lg:grid-cols-2"
      )}>
        {currentRound?.partidos.map((match) => {
          const realMatch = dbResults[match.id.toString()];
          const homeTeam = realMatch?.home_team_id || (match as any).equipo_local;
          const awayTeam = realMatch?.away_team_id || (match as any).equipo_visitante;
          const isMatchOpen = (realMatch && realMatch.status !== 'bloqueado') || (match.estado !== 'bloqueado');
          const isFinal = match.id.toString() === '104';

          if (isFinal) {
            return (
              <div 
                key={match.id} 
                className="relative col-span-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-2 border-primary/30 rounded-[3rem] p-8 md:p-16 overflow-hidden group shadow-[0_0_50px_rgba(251,191,36,0.15)]"
              >
                {/* Epic Final background decorations */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
                
                <div className="relative z-10 flex flex-col items-center gap-12">
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter text-center">
                      Gran <span className="text-primary">Final</span>
                    </h2>
                    <div className="flex items-center gap-3 bg-primary text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                      The World Cup Final 2026
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 w-full">
                    {/* Home Finalist */}
                    <div className="flex flex-col items-center gap-6 flex-1 order-2 md:order-1">
                      <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl group-hover:border-primary/50 transition-all duration-700">
                        {getTeamFlagUrl(homeTeam) ? (
                          <img src={getTeamFlagUrl(homeTeam)!} className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000" alt="" />
                        ) : (
                          <span className="text-6xl md:text-8xl opacity-10">?</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <span className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter text-center h-12 flex items-center">
                        {getTeamName(homeTeam) || "Finalista A"}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2 order-1 md:order-2">
                      <span className="text-5xl md:text-7xl font-black text-primary/20 italic select-none">VS</span>
                    </div>

                    {/* Away Finalist */}
                    <div className="flex flex-col items-center gap-6 flex-1 order-3">
                      <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl group-hover:border-primary/50 transition-all duration-700">
                        {getTeamFlagUrl(awayTeam) ? (
                          <img src={getTeamFlagUrl(awayTeam)!} className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000" alt="" />
                        ) : (
                          <span className="text-6xl md:text-8xl opacity-10">?</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <span className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter text-center h-12 flex items-center">
                        {getTeamName(awayTeam) || "Finalista B"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 pt-8 border-t border-white/10 w-full max-w-md">
                     <div className="flex items-center gap-3 text-xs font-black text-white/40 uppercase tracking-[0.2em]">
                        <Calendar className="w-4 h-4" /> 19 de Julio, 2026 • 20:00 Local
                     </div>
                     <div className="flex items-center gap-3 text-xs font-black text-white/60 uppercase tracking-[0.1em]">
                        <MapPin className="w-4 h-4 text-primary" /> MetLife Stadium, New York/New Jersey
                     </div>
                  </div>

                  {isMatchOpen && (
                    <button className="px-12 py-5 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-110 transition-all shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                      Cargar Pronóstico Final
                    </button>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div 
              key={match.id} 
              className={cn(
                "group relative bg-white/[0.03] border border-white/10 rounded-[2rem] p-5 md:p-6 transition-all hover:border-primary/30 backdrop-blur-md",
                !isMatchOpen && "opacity-40 grayscale"
              )}
            >
              {/* Compact Match Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">Partido #{match.id}</span>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{match.fecha ? new Date(match.fecha).toLocaleDateString() : 'TBD'} • 18:00</span>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1.5 border",
                  isMatchOpen ? "bg-primary/10 text-primary border-primary/20" : "bg-white/5 text-white/20 border-transparent"
                )}>
                  {!isMatchOpen ? <Lock className="w-3 h-3" /> : <Swords className="w-3 h-3" />}
                  {isMatchOpen ? 'ABIERTO' : 'BLOQUEADO'}
                </div>
              </div>

              {/* Teams (Slim Layout for Mobile) */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <div className="w-12 h-8 md:w-16 md:h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-lg">
                    {getTeamFlagUrl(homeTeam) ? (
                      <img src={getTeamFlagUrl(homeTeam)!} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xl opacity-10">?</span>
                    )}
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-white/90 truncate uppercase tracking-tight w-full text-center">
                    {getTeamName(homeTeam) || match.home_placeholder}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                  <span className="text-[9px] font-black text-white/10 italic">VS</span>
                </div>

                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <div className="w-12 h-8 md:w-16 md:h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-lg">
                    {getTeamFlagUrl(awayTeam) ? (
                      <img src={getTeamFlagUrl(awayTeam)!} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xl opacity-10">?</span>
                    )}
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-white/90 truncate uppercase tracking-tight w-full text-center">
                    {getTeamName(awayTeam) || match.away_placeholder}
                  </span>
                </div>
              </div>

              {/* Match Venue Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[8px] font-bold text-white/20 uppercase tracking-widest truncate">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{match.estadio || "Stadium TBD"}</span>
                </div>
                {isMatchOpen && (
                  <button className="text-[9px] font-black text-primary uppercase border-b border-primary/30 hover:border-primary transition-all">
                    Pronosticar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State / Legend */}
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
