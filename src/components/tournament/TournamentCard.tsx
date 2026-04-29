"use client";

import React from "react";
import { TournamentCardProps } from "@/types/tournament";

export const TournamentCard = ({ view, groupLetter, teams, matchInfo }: TournamentCardProps) => {
  // Vista: Carrousel de Grupos
  if (view === "group" && teams) {
    return (
      <div className="bento-card w-[300px] sm:w-[320px] shadow-2xl bg-card-body/60 border-white/5 overflow-hidden p-0">
        <div className="bg-card-header/80 px-7 py-5 flex items-center justify-between border-b border-white/5">
          <h3 className="text-2xl font-black tracking-tight text-title drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]">
            Grupo {groupLetter}
          </h3>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Posiciones</span>
        </div>
        <div className="p-7 flex flex-col gap-3">
          {teams.map((team, idx) => (
            <div key={team.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 group cursor-default">
              <div className="flex items-center gap-4">
                <span className="font-bold text-xs text-muted-foreground/60 w-4 text-center">{idx + 1}</span>
                <div className="w-9 h-6 bg-primary/10 rounded-md overflow-hidden shadow-inner flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
                  <span className="text-[10px] font-black text-primary/60 uppercase">{team.id.slice(0,3)}</span>
                </div>
                <span className="font-bold text-sm text-white/90 group-hover:text-primary transition-colors">{team.nombre}</span>
              </div>
              <div className="flex gap-4 text-[11px] font-bold text-white/60">
                <span title="Puntos" className="w-5 text-center bg-white/5 rounded px-1">0</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vista: Fixture / Partidos
  if (view === "match" && matchInfo) {
    return (
      <div className="bento-card w-full shadow-2xl bg-card-body/60 transition-all hover:scale-[1.02] duration-500 border-white/5 overflow-hidden p-0">
        <div className="bg-card-header/80 px-7 py-4 flex items-center justify-between border-b border-white/5">
          <span className="text-[10px] text-title font-black uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]">{matchInfo.fase}</span>
          {matchInfo.fecha && <span className="text-[10px] text-white/40 font-bold uppercase">{new Date(matchInfo.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>}
        </div>
        <div className="p-7 flex flex-col gap-5">
          {[matchInfo.home, matchInfo.away].map((team, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-primary/10 rounded-lg overflow-hidden shadow-inner flex items-center justify-center border border-white/5">
                  <span className="text-xs font-black text-primary/60">{team.id !== "TBD" ? team.id.slice(0,3) : "?"}</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-white">{team.nombre}</span>
              </div>
              <input
                type="number"
                min="0"
                disabled
                className="score-input opacity-80"
                placeholder="-"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
