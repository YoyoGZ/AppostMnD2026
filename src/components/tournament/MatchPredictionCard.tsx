"use client";

import React, { useState, useEffect } from "react";
import { MatchInfo } from "@/types/tournament";
import { Clock, Lock, Check, Loader2 } from "lucide-react";
import { getLocalMatchTimeText } from "@/lib/utils/date";
import { createClient } from "@/utils/supabase/client";
import { getTeamFlagUrl } from "@/lib/utils/flags";

export const MatchPredictionCard = ({ matchInfo, userId }: { matchInfo: MatchInfo, userId: string | null }) => {
  const [localTimeText, setLocalTimeText] = useState<string>("");
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [isSealed, setIsSealed] = useState<boolean>(false);
  const [isLockedByTime, setIsLockedByTime] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfirmMode, setShowConfirmMode] = useState<boolean>(false);
  const supabase = createClient();

  // 1. Cargar apuesta existente al montar el componente o cuando cambie el userId
  useEffect(() => {
    const fetchPrediction = async () => {
      if (!userId) return;
      
      const { data } = await supabase
        .from('predictions')
        .select('equipo_a_goles, equipo_b_goles, is_sealed')
        .eq('user_id', userId)
        .eq('match_id', matchInfo.id)
        .maybeSingle();
        
      if (data) {
        setHomeScore(data.equipo_a_goles.toString());
        setAwayScore(data.equipo_b_goles.toString());
        setIsSealed(data.is_sealed || false);
      }
      setIsLoading(false);
    };
    fetchPrediction();
  }, [matchInfo.id, supabase, userId]);

  // 2. Motor de Tiempo: Bloqueo 5 min antes
  useEffect(() => {
    if (matchInfo.fecha) {
      const fechaStr = matchInfo.fecha; // Captura para evitar errores de tipado en el closure
      setLocalTimeText(getLocalMatchTimeText(fechaStr));
      
      const checkLock = () => {
        const matchDate = new Date(fechaStr);
        const lockDate = new Date(matchDate.getTime() - 5 * 60 * 1000); 
        const now = new Date();
        if (now >= lockDate) {
          setIsLockedByTime(true);
        }
      };

      checkLock();
      const interval = setInterval(checkLock, 30000);
      return () => clearInterval(interval);
    }
  }, [matchInfo.fecha]);

  const isEntryDisabled = isSealed || isLockedByTime;

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

  return (
    <div className={`bento-card w-full shadow-2xl transition-all duration-500 border-white/5 overflow-hidden p-0 flex flex-col h-full group select-none
      ${isEntryDisabled ? "bg-card-body/40 scale-[0.98] border-green-500/10" : "bg-card-body/60 hover:scale-[1.02]"}
    `}>
      {/* Header */}
      <div className="bg-card-header/80 px-7 py-4 flex items-center justify-between border-b border-white/5">
        <span className="text-[10px] text-title font-black uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]">{matchInfo.fase}</span>
        {matchInfo.fecha && (
          <span className="text-[10px] text-white/40 font-bold uppercase">
            {new Date(matchInfo.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '')}
          </span>
        )}
      </div>

      {/* Body: Teams & Predictions */}
      <div className={`p-7 flex flex-col gap-5 flex-grow transition-opacity duration-300 ${isEntryDisabled ? "opacity-70 grayscale-[30%]" : "opacity-100"}`}>
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-6 rounded overflow-hidden flex items-center justify-center border border-white/5 ${isEntryDisabled ? "bg-white/5" : "bg-primary/10"}`}>
              {getTeamFlagUrl(matchInfo.home.id) ? (
                <img src={getTeamFlagUrl(matchInfo.home.id)!} alt={matchInfo.home.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-[10px] font-black ${isEntryDisabled ? "text-white/40" : "text-primary/60"}`}>{matchInfo.home.id !== "TBD" ? matchInfo.home.id.slice(0, 3) : "?"}</span>
              )}
            </div>
            <span className="font-bold text-lg tracking-tight text-white">{matchInfo.home.nombre}</span>
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
          <div className="flex items-center gap-4">
            <div className={`w-10 h-6 rounded overflow-hidden flex items-center justify-center border border-white/5 ${isEntryDisabled ? "bg-white/5" : "bg-primary/10"}`}>
              {getTeamFlagUrl(matchInfo.away.id) ? (
                <img src={getTeamFlagUrl(matchInfo.away.id)!} alt={matchInfo.away.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-[10px] font-black ${isEntryDisabled ? "text-white/40" : "text-primary/60"}`}>{matchInfo.away.id !== "TBD" ? matchInfo.away.id.slice(0, 3) : "?"}</span>
              )}
            </div>
            <span className="font-bold text-lg tracking-tight text-white">{matchInfo.away.nombre}</span>
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
      <div className={`px-6 py-3 border-t flex flex-col items-center justify-center transition-all duration-300 mt-auto min-h-[50px]
        ${isEntryDisabled ? "bg-green-500/5 border-green-500/10" : showConfirmMode ? "bg-black/80 border-orange-500/20" : hasBothScores ? "bg-primary/10 border-primary/20" : "bg-black/40 border-white/5 group-hover:bg-primary/5"}
      `}>
        {isSealed ? (
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
              <span className="text-[11px] font-black uppercase tracking-widest">Arena Cerrada</span>
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
};

