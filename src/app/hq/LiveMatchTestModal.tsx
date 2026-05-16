"use client";
import React, { useEffect, useState } from 'react';
import { X, Radio, Activity } from 'lucide-react';
import { getLiveMatchTestAction } from '@/app/actions/sync';
import Image from 'next/image';

export function LiveMatchTestModal({ onClose }: { onClose: () => void }) {
  const [matchData, setMatchData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    async function fetchMatch() {
      // Solo mostramos el loader principal la primera vez para no generar parpadeo molesto en el polling
      if (!matchData) setIsLoading(true);
      
      const res = await getLiveMatchTestAction();
      if (isMounted) {
        if (res.success && res.data) {
          setMatchData(res.data);
        } else {
          setError(res.error || "No se pudo cargar el partido en vivo.");
        }
        setIsLoading(false);
      }
    }

    // Primera carga inmediata
    fetchMatch();

    // Polling cada 30 segundos (30000 ms)
    intervalId = setInterval(() => {
      fetchMatch();
    }, 30000);

    // Cleanup: Al cerrar la tarjeta, destruimos el intervalo y las actualizaciones
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Traducción del estado corto de la API a español para el usuario
  const translateStatus = (shortStatus: string) => {
    const map: Record<string, string> = {
      '1H': '1T',
      '2H': '2T',
      'HT': 'E.T.', // Entretiempo
      'ET': 'T.E.', // Tiempo Extra
      'P': 'PEN',
      'PEN': 'PEN',
      'FT': 'FIN',
      'NS': 'PEND',
    };
    return map[shortStatus] || shortStatus;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0a0d14] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-500/20 blur-[80px] pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Prueba En Vivo</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white/50 hover:text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 relative z-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Activity className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-white/50 uppercase tracking-widest">Conectando con API-Football...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4">
              <p className="text-red-400 font-bold mb-2">Sin partidos activos</p>
              <p className="text-white/40 text-xs leading-relaxed">{error}</p>
            </div>
          ) : matchData ? (
            <div className="bento-card border-red-500/20 relative overflow-hidden p-6">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
              
              <div className="flex flex-col gap-6">
                {/* LIGA / COMPETICIÓN INFO */}
                <div className="flex flex-col items-center gap-1.5 border-b border-white/5 pb-5">
                  <span className="text-xs font-black uppercase tracking-widest text-white/80 text-center">
                    {matchData.league?.name || "Liga Desconocida"}
                  </span>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {matchData.league?.country || "Internacional"}
                  </span>
                </div>

                {/* Status Bar */}
                <div className="flex justify-between items-center bg-black/60 rounded-full px-5 py-2 border border-white/5 mx-auto min-w-[140px]">
                  <span className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    LIVE
                  </span>
                  <span className="text-xs font-black text-white">
                    {translateStatus(matchData.fixture.status.short)} {matchData.fixture.status.elapsed ? `- ${matchData.fixture.status.elapsed}'` : ''}
                  </span>
                </div>

                {/* Teams & Score */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col items-center gap-4 w-[40%]">
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      {matchData.teams.home.logo ? (
                        <Image src={matchData.teams.home.logo} alt={matchData.teams.home.name} fill className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                      ) : (
                        <div className="w-full h-full bg-white/5 rounded-full border border-white/10" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white leading-tight text-center line-clamp-2">
                      {matchData.teams.home.name}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1 w-[20%]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-5xl font-black tabular-nums">{matchData.goals.home ?? '0'}</span>
                      <span className="text-white/20 font-bold text-2xl">-</span>
                      <span className="text-5xl font-black tabular-nums">{matchData.goals.away ?? '0'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 w-[40%]">
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      {matchData.teams.away.logo ? (
                        <Image src={matchData.teams.away.logo} alt={matchData.teams.away.name} fill className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                      ) : (
                        <div className="w-full h-full bg-white/5 rounded-full border border-white/10" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white leading-tight text-center line-clamp-2">
                      {matchData.teams.away.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <p className="text-[10px] text-white/40 text-center mt-6 leading-relaxed font-mono">
            ENDPOINT: /fixtures?live=all | MODO: PRODUCCIÓN
          </p>
        </div>
      </div>
    </div>
  );
}
