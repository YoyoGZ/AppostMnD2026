"use client";

import React from 'react';
import { Swords, Trophy, Ghost, MessageSquareText } from 'lucide-react';

type DuelParticipant = {
  userId: string;
  alias: string;
  isWinner: boolean;
};

type Duel = {
  id: string;
  matchId: string;
  matchName?: string; // Ahora llega el nombre del partido
  status: string;
  createdAt: string;
  participants: DuelParticipant[];
};

export function DuelChronicles({ duels, totalWins = 0 }: { duels: Duel[], totalWins?: number }) {
  if (duels.length === 0) {
    return (
      <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center">
        <Ghost className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
          Aún no hay crónicas en esta Arena
        </p>
      </div>
    );
  }

  // Lógica de Taunts por Rango (Gamificación)
  const getTaunt = (duel: Duel) => {
    if (duel.status === 'active') return "¡La batalla está rugiendo! ⚔️";
    
    const winners = duel.participants.filter(p => p.isWinner);
    if (winners.length === 0) {
      return "Cheee... miren más fútbol !! 🤡";
    }

    if (totalWins === 0) return "Cheee... miren más fútbol !! 🤡";
    if (totalWins < 3) return "Vamos Titán, vos podés !! 💪";
    if (totalWins >= 3 && totalWins < 10) return "Vamos Master !!! 🔥";
    return "¡Aplaudan al Capo que sabe, che! 👑";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mb-6 flex items-center gap-3">
        <MessageSquareText className="w-4 h-4" /> Crónicas del Coliseo
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {duels.map((duel) => (
          <div 
            key={duel.id}
            className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${
              duel.status === 'active' 
                ? 'bg-yellow-500/5 border-yellow-500/20' 
                : 'bg-black/40 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="p-5 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">
                    {new Date(duel.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-black text-white italic">
                    {duel.matchName || `Partido #${duel.matchId}`}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  duel.status === 'active' ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-white/10 text-white/50'
                }`}>
                  {duel.status === 'active' ? 'En Batalla' : 'Finalizado'}
                </div>
              </div>

              {/* Gladiadores */}
              <div className="flex flex-wrap gap-2 mb-4">
                {duel.participants.map((p) => (
                  <div 
                    key={p.userId}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold ${
                      p.isWinner 
                        ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {p.isWinner && <Trophy className="w-3 h-3" />}
                    {p.alias}
                  </div>
                ))}
              </div>

              {/* Taunt / Comentario */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0">
                  <Swords className={`w-4 h-4 ${duel.status === 'active' ? 'text-yellow-500 animate-pulse' : 'text-white/20'}`} />
                </div>
                <div className="flex flex-col">
                   <p className={`text-[11px] font-bold italic leading-tight ${duel.status === 'active' ? 'text-yellow-500/80' : 'text-primary/70'}`}>
                    "{getTaunt(duel)}"
                  </p>
                  {duel.status === 'resolved' && duel.participants.filter(p => p.isWinner).length === 0 && (
                    <p className="text-[9px] font-black text-red-400/60 uppercase mt-1">No hubo vencedor acá</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
