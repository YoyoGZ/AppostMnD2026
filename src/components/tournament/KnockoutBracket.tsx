'use client'
import React, { useState } from 'react';
import { Trophy, Lock, ChevronRight, Swords, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import knockoutData from '@/data/knockouts-simulation.json';

/**
 * KnockoutBracket: El motor visual para las llaves eliminatorias del Mundial 2026.
 * Diseñado para ser Mobile-First y altamente intuitivo.
 */
export default function KnockoutBracket() {
  const [activeRound, setActiveRound] = useState(knockoutData.rondas[0].id);

  const currentRound = knockoutData.rondas.find(r => r.id === activeRound);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* 1. Selector de Rondas (Tabs Premium) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar snap-x scroll-px-4">
        {knockoutData.rondas.map((round) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
        {currentRound?.partidos.map((match) => (
          <div 
            key={match.id} 
            className={cn(
              "group relative bg-gradient-to-br from-white/[0.07] to-transparent border border-white/10 rounded-[2.5rem] p-6 transition-all hover:border-primary/30 overflow-hidden",
              match.estado === 'bloqueado' && "opacity-60 grayscale-[0.5]"
            )}
          >
            {/* Background Blur Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />

            {/* Match Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                <span>{match.fecha ? new Date(match.fecha).toLocaleDateString() : 'TBD'}</span>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5",
                match.estado === 'bloqueado' ? "bg-white/5 text-white/30" : "bg-primary/10 text-primary border border-primary/20"
              )}>
                {match.estado === 'bloqueado' ? <Lock className="w-3 h-3" /> : <Swords className="w-3 h-3" />}
                {match.estado === 'bloqueado' ? 'BLOQUEADO' : 'ABIERTO'}
              </div>
            </div>

            {/* Teams Row */}
            <div className="flex items-center justify-between gap-4 relative">
              {/* Home */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
                  <span className="text-3xl opacity-40">?</span>
                </div>
                <span className="text-xs font-black text-white/60 text-center uppercase tracking-tight h-8 flex items-center">
                  {match.home_placeholder}
                </span>
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-black text-white/10">VS</span>
              </div>

              {/* Away */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
                  <span className="text-3xl opacity-40">?</span>
                </div>
                <span className="text-xs font-black text-white/60 text-center uppercase tracking-tight h-8 flex items-center">
                  {match.away_placeholder}
                </span>
              </div>
            </div>

            {/* Stadium Info */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
              <MapPin className="w-3 h-3" />
              <span>{match.estadio}</span>
            </div>
            
            {/* Hover Action (Draft) */}
            {match.estado !== 'bloqueado' && (
              <div className="absolute inset-0 bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-black font-black text-xs uppercase tracking-[0.3em]">Cargar Apuesta</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State / Legend */}
      <div className="flex justify-center pt-12">
         <div className="flex items-center gap-6 text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-8 py-4 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" /> Definido
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/20" /> Pendiente
            </div>
         </div>
      </div>

    </div>
  );
}
