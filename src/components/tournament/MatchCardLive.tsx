"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import worldCupData from "@/data/world-cup-2026.json";
import { getTeamFlagUrl } from "@/lib/utils/flags";
import { Swords, Clock, Trophy, Play, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LiveMatchData = {
  id: number;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  elapsed: number;
  last_sync: string;
  api_fixture_id?: number;
};

type GoalEvent = {
  team: string;
  player: string;
  minute: string;
  timestamp: string;
};

export function MatchCardLive() {
  const [liveMatch, setLiveMatch] = useState<LiveMatchData | null>(null);
  const [nextMatch, setNextMatch] = useState<any | null>(null);
  const [liveGoal, setLiveGoal] = useState<GoalEvent | null>(null);
  const [isGoalRecent, setIsGoalRecent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [localElapsed, setLocalElapsed] = useState<number>(0);
  const [goalsList, setGoalsList] = useState<any[]>([]);

  const supabase = createClient();

  // Mapa de equipos para obtener nombres completos
  const teamMap = new Map<string, string>();
  worldCupData.equipos.forEach(t => teamMap.set(t.id, t.nombre));

  useEffect(() => {
    const fetchLiveAndNext = async () => {
      try {
        // 1. Consultar si hay algún partido en vivo en match_results
        // Los estados en vivo son aquellos que no son 'pending', 'finished' ni 'bloqueado'
        const { data: dbMatches, error } = await supabase
          .from("match_results")
          .select("*")
          .headers({ 'Cache-Control': 'no-cache' });

        if (error) throw error;

        // Filtrar partidos activos en vivo
        const activeMatch = (dbMatches || []).find((m: any) => 
          m.status && !["pending", "finished", "bloqueado"].includes(m.status)
        );

        if (activeMatch) {
          setLiveMatch({
            id: activeMatch.id,
            home_team_id: activeMatch.home_team_id || "TBD",
            away_team_id: activeMatch.away_team_id || "TBD",
            home_score: activeMatch.home_score,
            away_score: activeMatch.away_score,
            status: activeMatch.status,
            elapsed: activeMatch.elapsed ?? 0,
            last_sync: activeMatch.last_sync,
            api_fixture_id: activeMatch.api_fixture_id
          });

          setLocalElapsed(activeMatch.elapsed ?? 0);

          // Cargar gol reciente para este partido
          const { data: goalData } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", `goal_${activeMatch.id}`)
            .headers({ 'Cache-Control': 'no-cache' })
            .maybeSingle();

          if (goalData?.value) {
            try {
              setLiveGoal(JSON.parse(goalData.value));
            } catch (e) {
              console.error("Error parsing goal:", e);
            }
          }

          // Cargar lista completa de goles
          const { data: goalsData } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", `goals_${activeMatch.id}`)
            .headers({ 'Cache-Control': 'no-cache' })
            .maybeSingle();

          if (goalsData?.value) {
            try {
              setGoalsList(JSON.parse(goalsData.value));
            } catch (e) {
              console.error("Error parsing goals:", e);
            }
          }
        } else {
          // Si no hay partido activo, verificamos si hay algún partido en juego según la hora local
          const now = new Date();
          const inminentMatch = worldCupData.partidos.find(m => {
            const matchDate = new Date(m.fecha);
            const diffMinutes = (now.getTime() - matchDate.getTime()) / (60 * 1000);
            return diffMinutes >= 0 && diffMinutes < 150; // ventana de 2.5 horas
          });

          if (inminentMatch) {
            console.log("[MatchCardLive] Detectado partido inminente que debería estar en vivo según reloj. Disparando sync real...");
            import('@/app/actions/sync').then(({ syncLiveMatchesAction }) => {
              syncLiveMatchesAction();
            });
          }

          // Buscamos el primer partido futuro programado
          const futureMatches = worldCupData.partidos
            .filter(m => new Date(m.fecha) > now)
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

          if (futureMatches.length > 0) {
            setNextMatch(futureMatches[0]);
          }
        }
      } catch (err) {
        console.error("Error cargando el modulo live hub:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveAndNext();
  }, [supabase]);

  // 1. Suscripción global a match_results para detectar cuando un partido entra en juego o cambia su estado
  useEffect(() => {
    const matchChannel = supabase
      .channel("live-hub-global-matches")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "match_results"
      }, (payload: any) => {
        const newRecord = payload.new;
        if (newRecord) {
          const isActive = newRecord.status && !["pending", "finished", "bloqueado"].includes(newRecord.status);
          if (isActive) {
            // El partido está en juego: actualizar liveMatch de inmediato
            setLiveMatch({
              id: newRecord.id,
              home_team_id: newRecord.home_team_id || "TBD",
              away_team_id: newRecord.away_team_id || "TBD",
              home_score: newRecord.home_score,
              away_score: newRecord.away_score,
              status: newRecord.status,
              elapsed: newRecord.elapsed ?? 0,
              last_sync: newRecord.last_sync,
              api_fixture_id: newRecord.api_fixture_id
            });
            setLocalElapsed(newRecord.elapsed ?? 0);
          } else {
            // Si el partido en vivo actual finalizó o volvió a pendiente, removerlo de la vista
            setLiveMatch(prev => (prev && prev.id === newRecord.id) ? null : prev);
          }
        }
      })
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
    };
  }, [supabase]);

  // 2. Suscripción dinámica para goles del partido activo actual
  useEffect(() => {
    if (!liveMatch) {
      setGoalsList([]);
      setLiveGoal(null);
      return;
    }

    // Escuchar cambios del gol más reciente en vivo (alerta rápida)
    const goalChannel = supabase
      .channel(`live-hub-goal-${liveMatch.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "app_settings",
        filter: `key=eq.goal_${liveMatch.id}`
      }, (payload: any) => {
        const newRecord = payload.new;
        if (newRecord?.value) {
          try {
            setLiveGoal(JSON.parse(newRecord.value));
          } catch (e) {
            console.error("Error parsing realtime goal:", e);
          }
        }
      })
      .subscribe();

    // Escuchar lista completa de goles en vivo
    const goalsChannel = supabase
      .channel(`live-hub-goals-${liveMatch.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "app_settings",
        filter: `key=eq.goals_${liveMatch.id}`
      }, (payload: any) => {
        const newRecord = payload.new;
        if (newRecord?.value) {
          try {
            setGoalsList(JSON.parse(newRecord.value));
          } catch (e) {
            console.error("Error parsing realtime goals:", e);
          }
        }
      })
      .subscribe();

    return () => {
      goalChannel.unsubscribe();
      goalsChannel.unsubscribe();
    };
  }, [liveMatch?.id, supabase]);

  // Reloj Optimista: Avanza el tiempo transcurrido local cada 60s si el partido está en juego
  useEffect(() => {
    if (!liveMatch) return;
    
    // Función para calcular el elapsed ajustado según el last_sync de Supabase y el reloj del navegador
    const getAdjustedElapsed = (dbElapsed: number, lastSyncStr: string) => {
      const activeStatuses = ["1H", "2H", "ET", "playing"];
      if (!activeStatuses.includes(liveMatch.status) || !lastSyncStr) {
        return dbElapsed;
      }
      
      const lastSync = new Date(lastSyncStr);
      const now = new Date();
      const diffMs = now.getTime() - lastSync.getTime();
      const diffMinutes = Math.floor(diffMs / (60 * 1000));
      
      // Ajuste de seguridad: si el desfase es coherente (mayor a 0 y menor a 60 minutos)
      if (diffMinutes > 0 && diffMinutes < 60) {
        return dbElapsed + diffMinutes;
      }
      return dbElapsed;
    };

    const initialElapsed = getAdjustedElapsed(liveMatch.elapsed, liveMatch.last_sync);
    setLocalElapsed(initialElapsed);

    const activeStatuses = ["1H", "2H", "ET", "playing"];
    if (!activeStatuses.includes(liveMatch.status)) {
      return; // No avanza en HT, P o finished
    }

    const interval = setInterval(() => {
      setLocalElapsed(prev => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, [liveMatch?.elapsed, liveMatch?.status, liveMatch?.last_sync]);

  // Controlar si el gol es reciente (< 5 minutos)
  useEffect(() => {
    if (!liveGoal) {
      setIsGoalRecent(false);
      return;
    }

    const checkRecency = () => {
      const diff = new Date().getTime() - new Date(liveGoal.timestamp).getTime();
      const isRecent = diff > 0 && diff < 5 * 60 * 1000;
      setIsGoalRecent(isRecent);
    };

    checkRecency();
    const interval = setInterval(checkRecency, 10000);
    return () => clearInterval(interval);
  }, [liveGoal]);

  const mapStatusToEsp = (status: string) => {
    if (status === "1H") return "1T";
    if (status === "HT") return "Entretiempo";
    if (status === "2H") return "2T";
    if (status === "ET") return "T. Extra";
    if (status === "P") return "Penales";
    return "En Juego";
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${day}/${month} a las ${hours}:${minutes} hs`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Conectando al Live Hub...
        </span>
      </div>
    );
  }

  // --- CASO: NO HAY PARTIDO EN JUEGO ---
  if (!liveMatch) {
    return (
      <div className="bg-[#04040c]/40 border border-white/5 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[280px]">
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-white/20" />
        </div>
        
        <p className="text-sm md:text-base font-medium text-white/80 max-w-xl leading-relaxed px-4">
          No hay un partido en juego a esta hora, el próximo encuentro programado será el{" "}
          {nextMatch ? (
            <>
              <span className="text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-black mx-1 tracking-widest inline-block select-all">
                {nextMatch.local} vs {nextMatch.visitante}
              </span>
              , el próximo <span className="text-primary font-black">{formatDateLabel(nextMatch.fecha)}</span>
            </>
          ) : (
            <span className="text-white/30 font-black">---</span>
          )}
        </p>
      </div>
    );
  }

  // --- CASO: PARTIDO EN JUEGO EN VIVO ---
  const homeName = teamMap.get(liveMatch.home_team_id) || liveMatch.home_team_id;
  const awayName = teamMap.get(liveMatch.away_team_id) || liveMatch.away_team_id;

  return (
    <div className="bg-gradient-to-br from-[#0c0c24]/90 via-[#050515]/95 to-[#010105]/98 border border-white/10 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Background radial glow active */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-500/5 rounded-full blur-[80px] -z-10 animate-pulse pointer-events-none" />

      {/* Header: EN VIVO */}
      <div className="flex items-center justify-between mb-8">
        <span className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          En Vivo
        </span>
        <span className="text-xs font-black text-white bg-white/10 px-3.5 py-1 rounded-full border border-white/10 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {mapStatusToEsp(liveMatch.status)}
          {liveMatch.status !== "HT" && (
            <span>• {localElapsed}'</span>
          )}
        </span>
      </div>

      {/* Ticker de Gol Reciente */}
      {isGoalRecent && liveGoal && (
        <div className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-600/5 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center justify-between text-xs font-black uppercase text-green-400 tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.2)] animate-bounce duration-1000">
          <span className="flex items-center gap-2">
            <span className="text-base">⚽</span>
            <span>¡GOL DE {liveGoal.team === "MEX" ? "MÉXICO" : liveGoal.team === "RSA" ? "SUDÁFRICA" : liveGoal.team}!</span>
          </span>
          <span className="bg-green-500/20 px-3.5 py-1 rounded-xl text-green-200 border border-green-500/10 tracking-widest text-[10px]">
            {liveGoal.player} ({liveGoal.minute}')
          </span>
        </div>
      )}

      {/* Cancha / Versus */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 relative">
        {/* Local */}
        <div className="flex flex-col items-center text-center gap-3 flex-1">
          <div className="w-20 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center p-1 shadow-md">
            {getTeamFlagUrl(liveMatch.home_team_id) ? (
              <img src={getTeamFlagUrl(liveMatch.home_team_id)!} alt={homeName} className="w-full h-full object-cover rounded-[4px]" />
            ) : (
              <span className="text-sm font-black text-white/40">{liveMatch.home_team_id}</span>
            )}
          </div>
          <span className="text-lg font-black text-white tracking-tight leading-none">{homeName}</span>
          
          {/* Goles del equipo local (permanente) */}
          {goalsList && goalsList.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-1 animate-in fade-in duration-300">
              {goalsList.filter((g: any) => g.team === liveMatch.home_team_id).map((g: any, idx: number) => (
                <span key={idx} className="text-[10px] text-white/50 font-bold tracking-tight">
                  ⚽ {g.player} ({g.minute}')
                </span>
              ))}
            </div>
          )}

          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Local</span>
        </div>

        {/* Marcador Gigante */}
        <div className="flex items-center justify-center gap-4 shrink-0 px-6">
          <div className="text-5xl md:text-6xl font-black text-white font-mono bg-black/50 border border-white/5 rounded-2xl px-5 py-3 tracking-widest shadow-inner">
            {liveMatch.home_score ?? 0}
          </div>
          <span className="text-white/20 font-black text-2xl uppercase tracking-widest flex flex-col items-center">
            <Swords className="w-6 h-6 text-white/30 mb-1" />
            vs
          </span>
          <div className="text-5xl md:text-6xl font-black text-white font-mono bg-black/50 border border-white/5 rounded-2xl px-5 py-3 tracking-widest shadow-inner">
            {liveMatch.away_score ?? 0}
          </div>
        </div>

        {/* Visitante */}
        <div className="flex flex-col items-center text-center gap-3 flex-1">
          <div className="w-20 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center p-1 shadow-md">
            {getTeamFlagUrl(liveMatch.away_team_id) ? (
              <img src={getTeamFlagUrl(liveMatch.away_team_id)!} alt={awayName} className="w-full h-full object-cover rounded-[4px]" />
            ) : (
              <span className="text-sm font-black text-white/40">{liveMatch.away_team_id}</span>
            )}
          </div>
          <span className="text-lg font-black text-white tracking-tight leading-none">{awayName}</span>

          {/* Goles del equipo visitante (permanente) */}
          {goalsList && goalsList.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-1 animate-in fade-in duration-300">
              {goalsList.filter((g: any) => g.team === liveMatch.away_team_id).map((g: any, idx: number) => (
                <span key={idx} className="text-[10px] text-white/50 font-bold tracking-tight">
                  ⚽ {g.player} ({g.minute}')
                </span>
              ))}
            </div>
          )}

          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Visitante</span>
        </div>
      </div>

      {/* Footer del Versus */}
      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-white/20 shrink-0" />
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
            Apuestas cerradas para este encuentro
          </span>
        </div>
        <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          Marcador Oficial Real
        </span>
      </div>
    </div>
  );
}
