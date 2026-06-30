"use client";

import React, { useState, useEffect } from "react";
import { MatchInfo } from "@/types/tournament";
import { Clock, Lock, Check, Loader2, Trophy } from "lucide-react";
import { getLocalMatchTimeText } from "@/lib/utils/date";
import { createClient } from "@/utils/supabase/client";
import { getTeamFlagUrl } from "@/lib/utils/flags";
import { cn } from "@/lib/utils";

const supabase = createClient();

export const MatchPredictionCard = ({ matchInfo, userId }: { matchInfo: MatchInfo, userId: string | null }) => {
  const [localTimeText, setLocalTimeText] = useState<string>("");
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [isSealed, setIsSealed] = useState<boolean>(false);
  const [isLockedByTime, setIsLockedByTime] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfirmMode, setShowConfirmMode] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  const [realResult, setRealResult] = useState<{ home_score: number; away_score: number; status: string; elapsed?: number } | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [liveGoal, setLiveGoal] = useState<{ team: string; player: string; minute: string; timestamp: string } | null>(null);
  const [isGoalRecent, setIsGoalRecent] = useState<boolean>(false);
  const [goalsList, setGoalsList] = useState<{ team: string; player: string; minute: string }[]>([]);

  const matchIdStr = matchInfo.id.toString();
  const matchIdInt = parseInt(matchIdStr) || 0;

  // 1. Cargar apuesta, resultado real, goles y escuchar cambios en vivo
  useEffect(() => {
    const fetchPredictionAndResult = async () => {
      if (userId && matchIdInt > 0) {
        const { data: predData } = await supabase
          .from('predictions')
          .select('equipo_a_goles, equipo_b_goles, is_sealed, points_earned')
          .eq('user_id', userId)
          .eq('match_id', matchIdInt)
          .maybeSingle();
          
        if (predData) {
          setHomeScore(predData.equipo_a_goles.toString());
          setAwayScore(predData.equipo_b_goles.toString());
          setIsSealed(predData.is_sealed || false);
          setPointsEarned(predData.points_earned);
        }
      }

      if (matchIdInt > 0) {
        // Cargar resultado oficial con elapsed
        const { data: resultData } = await supabase
          .from('match_results')
          .select('home_score, away_score, status, elapsed')
          .eq('id', matchIdInt)
          .maybeSingle();

        if (resultData) {
          setRealResult({
            home_score: resultData.home_score ?? 0,
            away_score: resultData.away_score ?? 0,
            status: resultData.status,
            elapsed: resultData.elapsed ?? 0
          });
        }
      }

      // Cargar gol reciente de app_settings
      const { data: settingData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', `goal_${matchIdStr}`)
        .maybeSingle();

      if (settingData?.value) {
        try {
          setLiveGoal(JSON.parse(settingData.value));
        } catch (e) {
          console.error("Error parsing goal:", e);
        }
      }

      // Cargar lista completa de goles de app_settings
      const { data: goalsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', `goals_${matchIdStr}`)
        .maybeSingle();

      if (goalsData?.value) {
        try {
          setGoalsList(JSON.parse(goalsData.value));
        } catch (e) {
          console.error("Error parsing goals list:", e);
        }
      }
      
      setIsLoading(false);
    };

    fetchPredictionAndResult();

    // Canal en tiempo real para el partido individual
    const channel = supabase
      .channel(`match-result-${matchIdStr}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'match_results',
        filter: `id=eq.${matchIdInt}`
      }, (payload: any) => {
        const newRecord = payload.new;
        if (newRecord) {
          setRealResult({
            home_score: newRecord.home_score ?? 0,
            away_score: newRecord.away_score ?? 0,
            status: newRecord.status,
            elapsed: newRecord.elapsed ?? 0
          });
        }
      })
      .subscribe();

    // Suscribirse a realtime para goles en app_settings
    const goalChannel = supabase
      .channel(`match-goal-${matchIdStr}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_settings',
        filter: `key=eq.goal_${matchIdStr}`
      }, (payload: any) => {
        const newRecord = payload.new;
        if (newRecord?.value) {
          try {
            setLiveGoal(JSON.parse(newRecord.value));
          } catch (e) {
            console.error("Error parsing goal realtime:", e);
          }
        }
      })
      .subscribe();

    // Suscribirse a realtime para la lista completa de goles en app_settings
    const goalsChannel = supabase
      .channel(`match-goals-${matchIdStr}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_settings',
        filter: `key=eq.goals_${matchIdStr}`
      }, (payload: any) => {
        const newRecord = payload.new;
        if (newRecord?.value) {
          try {
            setGoalsList(JSON.parse(newRecord.value));
          } catch (e) {
            console.error("Error parsing goals realtime:", e);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(goalChannel);
      supabase.removeChannel(goalsChannel);
    };
  }, [matchIdStr, matchIdInt, supabase, userId]);

  // Chequear periodicamente si el gol es reciente (< 5 minutos)
  useEffect(() => {
    if (!liveGoal) {
      setIsGoalRecent(false);
      return;
    }

    const checkRecency = () => {
      const diff = new Date().getTime() - new Date(liveGoal.timestamp).getTime();
      const isRecent = diff > 0 && diff < 5 * 60 * 1000; // 5 minutos
      setIsGoalRecent(isRecent);
    };

    checkRecency();
    const interval = setInterval(checkRecency, 10000); // cada 10s
    return () => clearInterval(interval);
  }, [liveGoal]);


  // 2. Motor de Tiempo: Bloqueo 5 min antes
  useEffect(() => {
    if (matchInfo.fecha) {
      const fechaStr = matchInfo.fecha; // Captura para evitar errores de tipado en el closure
      setLocalTimeText(getLocalMatchTimeText(fechaStr));
      
      const checkLock = () => {
        let matchDate = new Date(fechaStr);
        // Si la fecha es solo YYYY-MM-DD, le agregamos la hora de fin de dia (23:59:59) para desarrollo
        if (fechaStr.length === 10) {
          matchDate = new Date(`${fechaStr}T23:59:59`);
        }
        const lockDate = new Date(matchDate.getTime() - 5 * 60 * 1000); 
        const now = new Date();
        if (now >= lockDate) {
          setIsLockedByTime(true);
        } else {
          setIsLockedByTime(false);
        }
      };

      checkLock();
      const interval = setInterval(checkLock, 30000);
      return () => clearInterval(interval);
    }
  }, [matchInfo.fecha]);

  const isEntryDisabled = isSealed || isLockedByTime;

  // Para eliminatorias y simulación, mostramos el resultado de Supabase según su estado oficial ('playing' o 'finished') incondicionalmente
  const displayRealResult = realResult;

  // Use trim() to fix mobile keyboards appending spaces
  const hasBothScores = homeScore.trim().length > 0 && awayScore.trim().length > 0;

  const handleScoreChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 2) {
      setter(val);
    }
  };

  // 2. Guardar (Upsert) en Supabase al Sellar
  const handleAcceptPrediction = async () => {
    if (!hasBothScores) return;
    setIsSaving(true);
    
    try {
      if (!userId) throw new Error("Usuario no autenticado");
      
      const { error } = await supabase
        .from('predictions')
        .upsert({
          user_id: userId,
          match_id: matchInfo.id,
          equipo_a_goles: parseInt(homeScore),
          equipo_b_goles: parseInt(awayScore),
          is_sealed: true,
          sealed_at: new Date().toISOString(),
          match_start_time: matchInfo.fecha,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, match_id' });
        
      if (error) {
        console.error("Supabase Error:", error);
        alert("Error al sellar pronóstico");
        return;
      }
      
      setIsSealed(true); 
      setShowConfirmMode(false);
    } catch (error) {
      console.error("Error guardando predicción:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bento-card w-full shadow-2xl bg-card-body/40 p-0 flex flex-col h-full animate-pulse border-white/5">
        <div className="bg-card-header/40 px-7 py-4 h-12 border-b border-white/5" />
        <div className="p-7 flex flex-col gap-5 flex-grow">
          <div className="flex items-center justify-between"><div className="w-12 h-8 bg-white/5 rounded-lg" /><div className="w-12 h-10 bg-white/5 rounded-md" /></div>
          <div className="flex items-center justify-between"><div className="w-12 h-8 bg-white/5 rounded-lg" /><div className="w-12 h-10 bg-white/5 rounded-md" /></div>
        </div>
        <div className="px-6 py-4 h-12 bg-black/40 border-t border-white/5" />
      </div>
    );
  }

  const isFinalMatch = matchIdInt === 104;

  const normalCard = (
    <div className={`bento-card w-full shadow-2xl transition-all duration-500 border-white/5 overflow-hidden p-0 flex flex-col h-full group select-none
      ${isEntryDisabled ? "bg-card-body/40 scale-[0.98] border-green-500/10" : "bg-card-body/60 hover:scale-[1.02]"}
    `}>
      {/* Header */}
      <div className="bg-card-header/80 px-7 py-4 flex items-center justify-between border-b border-white/5">
        <span className="text-[10px] text-title font-black uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]">{matchInfo.fase}</span>
        {isFinalMatch && isFlipped ? (
          <button 
            onClick={() => setIsFlipped(false)}
            className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20 uppercase tracking-widest hover:bg-yellow-500/20 transition-all active:scale-95 z-20"
          >
            Ticket ✕
          </button>
        ) : matchInfo.fecha && (
          <span className="text-[10px] text-white/40 font-bold uppercase">
            {new Date(matchInfo.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '')}
          </span>
        )}
      </div>

      {/* Body: Teams & Predictions */}
      <div className={cn(
        "p-7 flex flex-col gap-5 flex-grow transition-all duration-300",
        isEntryDisabled ? "bg-card-body/10 opacity-80" : "opacity-100"
      )}>
        {/* Banner de Resultado Real Oficial (API o Simulador) */}
        {displayRealResult && displayRealResult.status !== 'pending' && (
          <div className={cn(
            "px-4 py-3 rounded-2xl flex items-center justify-between border text-[10px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-500",
            !['finished', 'pending', 'bloqueado'].includes(displayRealResult.status)
              ? "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]" 
              : "bg-white/5 border-white/5 text-slate-300"
          )}>
            <span className="flex items-center gap-1.5">
              {!['finished', 'pending', 'bloqueado'].includes(displayRealResult.status) ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>
                      {displayRealResult.status === '1H' ? `1T • ${displayRealResult.elapsed}'` :
                     displayRealResult.status === 'HT' ? "Entretiempo" :
                     displayRealResult.status === '2H' ? `2T • ${displayRealResult.elapsed}'` :
                     displayRealResult.status === 'ET' ? `T. Extra • ${displayRealResult.elapsed}'` :
                     displayRealResult.status === 'P' ? "Penales" :
                     `En Vivo • ${displayRealResult.elapsed}'`}
                  </span>
                </>
              ) : (
                <span>Resultado Real</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-white bg-black/40 px-3 py-1 rounded-xl">
                {displayRealResult.home_score} - {displayRealResult.away_score}
              </span>
              {pointsEarned !== null && (
                <span className={cn(
                  "px-2.5 py-1 rounded-xl text-[9px] font-black tracking-wider shadow-sm border",
                  pointsEarned === 5 ? "bg-green-500/20 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]" :
                  pointsEarned === 2 ? "bg-primary/20 text-primary border-primary/20" :
                  "bg-white/5 text-white/30 border-white/5"
                )}>
                  {pointsEarned === 5 ? "🏆 +5 PTS" :
                   pointsEarned === 2 ? "🏆 +2 PTS" :
                   "0 PTS"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Banner de Gol Reciente (Micro-animación premium) - Solo en juego */}
        {isGoalRecent && liveGoal && displayRealResult && !['finished', 'pending', 'bloqueado'].includes(displayRealResult.status) && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/5 border border-green-500/30 rounded-2xl px-4 py-3 flex items-center justify-between text-[10px] font-black uppercase text-green-400 tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.15)] animate-pulse">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm">⚽</span>
              <span>¡GOL DE {liveGoal.team === 'MEX' ? 'MÉXICO' : liveGoal.team === 'RSA' ? 'SUDÁFRICA' : liveGoal.team === 'CAN' ? 'CANADÁ' : liveGoal.team}!</span>
            </span>
            <span className="text-[9px] bg-green-500/20 px-2.5 py-1 rounded-xl text-green-300 border border-green-500/10 truncate max-w-[180px]">
              {liveGoal.player} ({liveGoal.minute}')
            </span>
          </div>
        )}

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-10 h-6 rounded overflow-hidden flex items-center justify-center border border-white/5 flex-shrink-0 ${isEntryDisabled ? "bg-white/5" : "bg-primary/10"}`}>
              {getTeamFlagUrl(matchInfo.home.id) ? (
                <img src={getTeamFlagUrl(matchInfo.home.id)!} alt={matchInfo.home.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-[10px] font-black ${isEntryDisabled ? "text-white/40" : "text-primary/60"}`}>{matchInfo.home.id !== "TBD" ? matchInfo.home.id.slice(0, 3) : "?"}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg tracking-tight text-white truncate">{matchInfo.home.nombre}</span>
              {/* Goles del equipo local compactos */}
              {displayRealResult && displayRealResult.status !== 'pending' && goalsList && goalsList.length > 0 && (
                <span className="text-[10px] text-white/50 font-medium tracking-tight mt-0.5 truncate" title={goalsList.filter((g: any) => g.team === matchInfo.home.id).map((g: any) => `${g.player} (${g.minute}')`).join(', ')}>
                  {goalsList.filter((g: any) => g.team === matchInfo.home.id).map((g: any) => `${g.player} (${g.minute}')`).join(', ')}
                </span>
              )}
            </div>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={homeScore}
            disabled={isEntryDisabled}
            onChange={handleScoreChange(setHomeScore)}
            className={`w-12 h-10 border rounded-md text-center text-lg font-black focus:outline-none transition-colors
              ${isEntryDisabled ? "bg-black/20 text-white/50 border-white/5" : "bg-black/40 text-title border-white/10 focus:border-primary/50 focus:bg-primary/10"}
            `}
            placeholder="-"
          />
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-10 h-6 rounded overflow-hidden flex items-center justify-center border border-white/5 flex-shrink-0 ${isEntryDisabled ? "bg-white/5" : "bg-primary/10"}`}>
              {getTeamFlagUrl(matchInfo.away.id) ? (
                <img src={getTeamFlagUrl(matchInfo.away.id)!} alt={matchInfo.away.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-[10px] font-black ${isEntryDisabled ? "text-white/40" : "text-primary/60"}`}>{matchInfo.away.id !== "TBD" ? matchInfo.away.id.slice(0, 3) : "?"}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg tracking-tight text-white truncate">{matchInfo.away.nombre}</span>
              {/* Goles del equipo visitante compactos */}
              {displayRealResult && displayRealResult.status !== 'pending' && goalsList && goalsList.length > 0 && (
                <span className="text-[10px] text-white/50 font-medium tracking-tight mt-0.5 truncate" title={goalsList.filter((g: any) => g.team === matchInfo.away.id).map((g: any) => `${g.player} (${g.minute}')`).join(', ')}>
                  {goalsList.filter((g: any) => g.team === matchInfo.away.id).map((g: any) => `${g.player} (${g.minute}')`).join(', ')}
                </span>
              )}
            </div>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={awayScore}
            disabled={isEntryDisabled}
            onChange={handleScoreChange(setAwayScore)}
            className={`w-12 h-10 border rounded-md text-center text-lg font-black focus:outline-none transition-colors
              ${isEntryDisabled ? "bg-black/20 text-white/50 border-white/5" : "bg-black/40 text-title border-white/10 focus:border-primary/50 focus:bg-primary/10"}
            `}
            placeholder="-"
          />
        </div>
      </div>

      {/* Footer: Dynamic Actions or Timezone */}
      <div className={cn(
        "px-6 py-3 border-t flex flex-col items-center justify-center transition-all duration-300 mt-auto min-h-[50px]",
        displayRealResult?.status === 'finished'
          ? "bg-black/60 border-white/5"
          : displayRealResult && !['finished', 'pending', 'bloqueado'].includes(displayRealResult.status)
          ? "bg-red-950/20 border-red-900/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
          : isSealed
          ? "bg-green-500/5 border-green-500/10"
          : showConfirmMode
          ? "bg-black/80 border-orange-500/20"
          : hasBothScores
          ? "bg-primary/10 border-primary/20"
          : "bg-black/40 border-white/5 group-hover:bg-primary/5"
      )}>
        {displayRealResult?.status === 'finished' ? (
          <div className="flex items-center justify-between w-full h-full text-white/50">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500/80 flex-shrink-0" />
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Partido Finalizado</span>
            </div>
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Resultados Oficiales</span>
          </div>
        ) : displayRealResult && !['finished', 'pending', 'bloqueado'].includes(displayRealResult.status) ? (
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-2 text-red-500">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest animate-pulse">En Juego</span>
            </div>
            <span className="text-[9px] text-red-500/55 font-bold uppercase tracking-wider">Apuestas Cerradas</span>
          </div>
        ) : isSealed ? (
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-[11px] font-bold text-green-400 uppercase tracking-widest">Sello de Apuesta</span>
            </div>
            <Check className="w-4 h-4 text-green-500/50" />
          </div>
        ) : isLockedByTime ? (
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-2 text-red-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest">Liga Cerrada</span>
            </div>
            <span className="text-[9px] text-red-500/50 font-bold uppercase">Límite alcanzado</span>
          </div>
        ) : showConfirmMode ? (
          <div className="flex flex-col w-full gap-2">
            <span className="text-[10px] text-center text-orange-400 font-bold uppercase tracking-wider mb-1">¿Confirmas tu Apuesta?</span>
            <div className="flex justify-between items-center w-full gap-2">
              <button onClick={() => setShowConfirmMode(false)} disabled={isSaving} className="flex-1 text-[10px] uppercase font-bold text-white/50 hover:text-white border border-white/10 rounded py-1.5 transition-colors">
                Volver
              </button>
              <button
                onClick={handleAcceptPrediction}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] uppercase rounded shadow-[0_0_15px_rgba(234,88,12,0.3)] disabled:opacity-50 transition-all"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                {isSaving ? "SELLANDO..." : "CONFIRMAR"}
              </button>
            </div>
          </div>
        ) : hasBothScores ? (
          <div className="flex items-center justify-between w-full h-full">
            <span className="text-[10px] uppercase font-black text-title/90">Apostar {homeScore}  a  {awayScore} </span>
            <button
              onClick={() => setShowConfirmMode(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground font-black text-[10px] uppercase rounded shadow-[0_0_10px_rgba(251,191,36,0.3)] hover:scale-105 transition-transform"
            >
              <Check className="w-3 h-3" /> APOSTAR
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full h-full">
            <Clock className="w-3.5 h-3.5 text-white/60 flex-shrink-0 group-hover:text-primary transition-colors" />
            <span className="text-[10.5px] sm:text-[11px] font-bold text-white/70 group-hover:text-white/90 transition-colors leading-tight">
              {localTimeText || "Horario por confirmar"}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!isFinalMatch) {
    return normalCard;
  }

  return (
    <div className="w-full [perspective:1500px] min-h-[300px]">
      <div className={cn(
        "relative w-full h-full min-h-[300px] transition-transform duration-1000 [transform-style:preserve-3d]",
        isFlipped ? "[transform:rotateY(180deg)]" : ""
      )}>
        {/* CARA FRONTAL: TICKET DE ORO PREMIUM */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-[2rem] border border-yellow-500/30 bg-gradient-to-br from-[#1a1200] via-[#0d0900] to-black p-8 flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.25)] group/final">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-yellow-500/5 rounded-full blur-[75px] group-hover/final:bg-yellow-500/10 transition-all duration-700 pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center w-full relative z-10">
            <span className="text-[10px] text-yellow-400 font-black tracking-[0.25em] uppercase drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">LA GRAN FINAL</span>
            <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>

          <div className="flex flex-col items-center justify-center py-6 gap-3 relative z-10">
            <span className="text-[9px] font-black text-yellow-500/45 uppercase tracking-[0.2em]">Copa del Mundo 2026</span>
            <div className="flex items-center justify-center gap-4 w-full px-2">
              <span className="font-black text-lg md:text-xl text-white truncate max-w-[130px] uppercase tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">{matchInfo.home.nombre}</span>
              <span className="text-xs font-black text-yellow-400/50 shrink-0">VS</span>
              <span className="font-black text-lg md:text-xl text-white truncate max-w-[130px] uppercase tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">{matchInfo.away.nombre}</span>
            </div>
            {matchInfo.fecha && (
              <span className="text-[9.5px] text-yellow-500/60 font-black uppercase tracking-[0.15em] mt-1 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
                {new Date(matchInfo.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
              </span>
            )}
          </div>

          <button 
            onClick={() => setIsFlipped(true)}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-[10px] tracking-[0.25em] uppercase rounded-2xl shadow-[0_10px_25px_rgba(250,204,21,0.3)] transition-all duration-300 hover:scale-[1.02] relative z-10 active:scale-[0.98]"
          >
            INGRESAR PRONÓSTICO 🏆
          </button>
        </div>

        {/* CARA TRASERA: LA CARD REAL DE APUESTA */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2rem] border border-yellow-500/30 bg-gradient-to-br from-black via-[#0d0900] to-[#120e00] shadow-[0_0_50px_rgba(250,204,21,0.15)] flex flex-col overflow-hidden">
          <div className="w-full h-full">
            {normalCard}
          </div>
        </div>
      </div>
    </div>
  );
};

