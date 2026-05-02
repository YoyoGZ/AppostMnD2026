"use client";

import React from 'react';
import { Swords, Check, Clock, User2, Trophy } from 'lucide-react';
import tournamentData from '@/data/world-cup-2026.json';

export type DuelParticipant = {
  userId: string;
  isWinner: boolean;
  alias: string;
};

export type Duel = {
  id: string;
  matchId: string;
  status: string; // 'pending' | 'active' | 'resolved'
  createdAt: string;
  participants: DuelParticipant[];
};

export function DuelsColiseum({ duels }: { duels: Duel[] }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!duels || duels.length === 0) return null;

  // Mapa de equipos para obtener nombres
  const teamMap = new Map();
  tournamentData.equipos.forEach(t => teamMap.set(t.id, t.nombre));

  const getMatchInfo = (matchId: string) => {
    const match = tournamentData.partidos.find(m => m.id.toString() === matchId);
    if (!match) return { label: "Partido Desconocido", date: "" };
    
    // Solo renderizamos la fecha formateada en el cliente para evitar errores de hidratación
    const dateLabel = mounted 
      ? new Date(match.fecha).toLocaleString('es-AR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : "";

    return {
      label: `${teamMap.get(match.local) || match.local} vs ${teamMap.get(match.visitante) || match.visitante}`,
      date: dateLabel
    };
  };

  return (
    <div className="mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-sm font-black uppercase text-primary tracking-widest flex items-center gap-2">
          <Swords className="w-5 h-5" /> El Coliseo
        </h3>
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider bg-white/5 px-2 py-1 rounded-full border border-white/10">
          {duels.length} Enfrentamientos
        </span>
      </div>

      {/* Bento Grid: Scroll horizontal en móvil, Grid en escritorio */}
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible px-2">
        {duels.map(duel => {
          const matchInfo = getMatchInfo(duel.matchId);
          return (
            <div 
              key={duel.id} 
              className="min-w-[280px] w-[85vw] md:w-auto snap-center shrink-0 bg-[#0a0a1a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-5 relative overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-primary/50 transition-all duration-300"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -z-10 group-hover:bg-primary/20 transition-all duration-500" />
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {duel.status === 'resolved' ? (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                    <Check className="w-3 h-3" /> Terminado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20 animate-pulse">
                    <Clock className="w-3 h-3" /> En Batalla
                  </span>
                )}
              </div>

              {/* Header: Partido */}
              <div className="mb-5 pr-20">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{matchInfo.date}</p>
                <h4 className="text-sm font-black text-white leading-tight">{matchInfo.label}</h4>
              </div>

              {/* Gladiadores */}
              <div className="flex flex-col gap-2 bg-black/40 rounded-2xl p-3 border border-white/5 relative">
                {/* Visual Connector */}
                <div className="absolute left-6 top-6 bottom-6 w-px bg-white/10" />

                {duel.participants.map((p, idx) => (
                  <div key={p.userId} className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${p.isWinner ? 'bg-primary border-primary' : 'bg-[#1a1a2e] border-white/20'}`}>
                        {p.isWinner ? <Trophy className="w-3 h-3 text-black" /> : <User2 className="w-3 h-3 text-white/60" />}
                      </div>
                      <span className={`text-xs font-bold ${p.isWinner ? 'text-primary' : 'text-white/80'}`}>{p.alias}</span>
                    </div>
                    {p.isWinner && (
                      <span className="text-[10px] font-black text-primary uppercase">
                        Vencedor
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
