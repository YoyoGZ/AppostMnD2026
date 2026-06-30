"use client";

import React, { useState, useEffect, useRef } from "react";
import worldCupData from "@/data/world-cup-2026.json";
import { GroupsCarousel } from "@/components/tournament/GroupsCarousel";
import { MatchPredictionCard } from "@/components/tournament/MatchPredictionCard";
import Modal from "@/components/ui/Modal";
import LigaRules from "@/components/tournament/LigaRules";
import { Info } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { PushOptInButton } from "@/components/pwa/PushOptInButton";
import { getStandingsLocalAction } from "@/app/actions/sync";
import { CorporateBentoHeader } from "@/components/dashboard/CorporateBentoHeader";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { MatchCardLive } from "@/components/tournament/MatchCardLive";
import { cn } from "@/lib/utils";

import knockoutData from "@/data/knockouts-simulation.json";

export default function Dashboard() {
  const { brandTheme } = useSidebar();
  const { user } = useAuth();
  const [activeGroup, setActiveGroup] = useState("A");
  const [showRules, setShowRules] = useState(false);
  const [showLiveMatch, setShowLiveMatch] = useState(false);
  const hasSyncedRef = useRef(false);
  const [standings, setStandings] = useState<any[]>([]);
  const [dbMatches, setDbMatches] = useState<any[]>([]);

  // 1. Cargar las standings calculadas localmente
  useEffect(() => {
    getStandingsLocalAction().then((res) => {
      if (res.success && res.standings) {
        setStandings(res.standings);
      }
    });
  }, []);

  // 2. Cargar en caliente los resultados reales y suscribirnos a realtime
  useEffect(() => {
    const supabase = createClient();
    
    // Carga inicial
    const fetchInitialMatches = async () => {
      const { data } = await supabase.from('match_results').select('*');
      if (data) setDbMatches(data);
    };
    fetchInitialMatches();

    // Suscripción Realtime
    const channel = supabase
      .channel('dashboard_matches_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_results' },
        (payload: any) => {
          // Actualizar partido cambiado
          setDbMatches((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === payload.new.id);
            if (idx >= 0) {
              updated[idx] = payload.new;
            } else {
              updated.push(payload.new);
            }
            return updated;
          });
          
          // Refrescar standings si se finalizó un partido
          if (payload.new.status === 'finished') {
            getStandingsLocalAction().then((res) => {
              if (res.success && res.standings) {
                setStandings(res.standings);
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Sincronización en caliente y en segundo plano de partidos si por fecha corresponde (sin mocks)
  useEffect(() => {
    if (dbMatches.length === 0 || hasSyncedRef.current) return;

    const now = new Date();
    const knockoutMatches = knockoutData.rondas.flatMap(r => r.partidos);
    
    const shouldSync = knockoutMatches.some(m => {
      if (!m.fecha) return false;
      const matchDate = new Date(m.fecha);
      const diffMinutes = (now.getTime() - matchDate.getTime()) / (60 * 1000);
      
      const dbMatch = dbMatches.find(dbM => dbM.id === m.id);
      const isDbPending = !dbMatch || dbMatch.status === 'pending';
      const isDbPlaying = dbMatch && !['pending', 'finished', 'bloqueado'].includes(dbMatch.status);
      
      // Si el partido comenzó y en la base de datos está pending o sigue en juego (para traer actualizaciones de gol en vivo)
      return (diffMinutes >= 0 && (isDbPending || isDbPlaying));
    });

    if (shouldSync) {
      hasSyncedRef.current = true; // Prevenir múltiples llamadas en bucle en esta sesión
      console.log("[Dashboard] Detectados partidos de eliminatorias en juego o desactualizados según horario. Ejecutando sync en caliente...");
      import('@/app/actions/sync').then(({ syncLiveMatchesAction }) => {
        syncLiveMatchesAction();
      });
    }
  }, [dbMatches]);

  const userId = user?.id || null;

  // 4. Organizar grupos en orden alfabético
  const groupedTeams = worldCupData.equipos.reduce((acc: any, team: any) => {
    if (!acc[team.grupo]) {
      acc[team.grupo] = [];
    }
    acc[team.grupo].push(team);
    return acc;
  }, {});

  const groupsData = Object.keys(groupedTeams)
    .sort() // alfabético A-L
    .map((letter) => {
      const groupStandings = standings.find((g: any[]) => g[0]?.group === `Grupo ${letter}`) || [];
      
      const mappedTeams = groupedTeams[letter].map((team: any) => {
        const teamStanding = groupStandings.find((s: any) => s.team.id === team.id);
        return {
          ...team,
          pts: teamStanding ? teamStanding.points : 0
        };
      });

      // Ordenar por puntos de mayor a menor
      mappedTeams.sort((a: any, b: any) => b.pts - a.pts);

      return {
        letter,
        teams: mappedTeams,
      };
    });

  // 4. Filtrar próximos partidos para el grupo activo (Motor de Jornada Activa)
  const groupMatches = worldCupData.partidos.filter((m: any) => m.grupo === activeGroup);

  // Agrupar partidos por jornada/fase
  const matchesByFase: Record<string, any[]> = {};
  groupMatches.forEach((m: any) => {
    if (!matchesByFase[m.fase]) {
      matchesByFase[m.fase] = [];
    }
    matchesByFase[m.fase].push(m);
  });

  // Determinar la jornada activa del grupo (J1, J2 o J3)
  const fasesOrdered = ["Grupos - J1", "Grupos - J2", "Grupos - J3"];
  let activeFase = fasesOrdered[0];

  for (const fase of fasesOrdered) {
    const faseMatches = matchesByFase[fase] || [];
    if (faseMatches.length === 0) continue;

    // Verificar si todos los partidos de esta jornada ya han finalizado en la BD
    const allFinished = faseMatches.every(m => {
      const dbMatch = dbMatches.find(dbM => dbM.id === m.id);
      return dbMatch && dbMatch.status === 'finished';
    });

    activeFase = fase;
    if (!allFinished) {
      // Si hay al menos un partido pendiente o en vivo, esta es la jornada activa actual
      break;
    }
  }

  // Se muestran todos los partidos correspondientes a la jornada activa
  const filteredMatches = (matchesByFase[activeFase] || [])
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Verificar si hay algún partido en vivo en dbMatches (estados distintos de 'pending', 'finished' y 'bloqueado')
  const hasLiveMatch = dbMatches.some(m => 
    m.status && !["pending", "finished", "bloqueado"].includes(m.status)
  );

  return (
    <div className="relative pb-12">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none" />

      <header className="mb-10 pt-4 md:pt-0 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 text-title drop-shadow-[0_2px_10px_rgba(56,189,248,0.3)]">MundiApp26</h2>
          <p className="text-white/60 text-sm font-medium">Panel General de tu Liga</p>
        </div>

        <div className="flex flex-col sm:flex-col gap-2 items-end w-full sm:w-auto">
          <div className="flex gap-2 items-center justify-between sm:justify-end w-full sm:w-auto">
            {/* Botón Live Hub */}
            <button
              onClick={() => setShowLiveMatch(true)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] transition-all group w-fit border animate-pulse",
                hasLiveMatch
                  ? "bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary shadow-[0_0_25px_rgba(250,204,21,0.45)]"
                  : "bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary/90 hover:text-primary shadow-[0_0_15px_rgba(250,204,21,0.15)] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
              )}
            >
              {hasLiveMatch ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span className="inline sm:hidden">VIVO</span>
                  <span className="hidden sm:inline">🔴 EN VIVO</span>
                </>
              ) : (
                <>
                  <span className="text-primary group-hover:scale-110 transition-transform">📡</span>
                  <span>EN VIVO</span>
                </>
              )}
            </button>

            <button 
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(251,191,36,0.1)] transition-all group w-fit"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:scale-110 transition-transform" />
              <span>Reglas</span>
            </button>
          </div>
          
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-3 justify-between sm:justify-start w-full sm:w-auto origin-right mt-1">
            <InstallAppButton />
            <PushOptInButton />
          </div>
        </div>
      </header>

      {/* Banner Corporativo Bento Desmontable */}
      <CorporateBentoHeader brandTheme={brandTheme} />

      <Modal 
        isOpen={showRules} 
        onClose={() => setShowRules(false)} 
        title="Reglas de la Liga"
      >
        <LigaRules />
      </Modal>

      <Modal 
        isOpen={showLiveMatch} 
        onClose={() => setShowLiveMatch(false)} 
        title="En Vivo • Marcador en Tiempo Real"
      >
        <MatchCardLive />
      </Modal>

      <section className="mb-16 relative z-10">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-white/90">
          <span className="w-2 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"></span>
          Posiciones por Grupo
        </h3>
        <GroupsCarousel 
          groups={groupsData} 
          onActiveGroupChange={(letter) => setActiveGroup(letter)}
        />
      </section>

      <section className="relative z-10 flex flex-col items-center">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-white/90 text-center">
          <span className="w-2 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"></span>
          Próximos Partidos: Grupo {activeGroup}
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-5xl">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match: any) => {
              const homeTeam = worldCupData.equipos.find((t: any) => t.id === match.local) || { id: match.local, nombre: "TBD" };
              const awayTeam = worldCupData.equipos.find((t: any) => t.id === match.visitante) || { id: match.visitante, nombre: "TBD" };

              return (
                <div key={match.id} className="w-full md:w-[420px] transform transition-all duration-500 hover:translate-y-[-4px]">
                  <MatchPredictionCard
                    matchInfo={{
                      id: match.id,
                      fase: match.fase,
                      fecha: match.fecha,
                      home: homeTeam,
                      away: awayTeam,
                    }}
                    userId={userId}
                  />
                </div>
              );
            })

          ) : (
            <div className="bento-card w-full py-12 flex flex-col items-center justify-center text-center opacity-70 border-dashed border-white/10">
              <p className="text-white/50 text-sm italic">No se encontraron encuentros programados para esta fase en el Grupo {activeGroup}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
