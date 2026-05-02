"use client";

import React, { useState, useEffect } from "react";
import worldCupData from "@/data/world-cup-2026.json";
import { MatchPredictionCard } from "@/components/tournament/MatchPredictionCard";
import { MatchInfo } from "@/types/tournament";
import { createClient } from "@/utils/supabase/client";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export default function MatchesPage() {
  const { equipos, partidos } = worldCupData;
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  // Mapa de equipos para acceso rápido por ID
  const teamsMap = equipos.reduce((acc, team) => {
    acc[team.id] = team;
    return acc;
  }, {} as Record<string, any>);

  const filteredMatches = partidos.filter(p => p.grupo === selectedGroup);

  return (
    <div className="relative pb-12">
      <header className="mb-6 pt-4 md:pt-0">
        <h2 className="text-3xl font-black tracking-tight mb-2 text-title drop-shadow-[0_2px_10px_rgba(0,212,255,0.3)]">
          Fase de Grupos
        </h2>
        <p className="text-white/60 text-sm font-medium">Selecciona un grupo para predecir</p>
      </header>

      {/* Selector de Grupos (Mini Cards 3x4 Grid) */}
      <div className="grid grid-cols-4 lg:grid-cols-6 gap-2 mb-8">
        {GROUPS.map(group => {
          const isActive = selectedGroup === group;
          return (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-300 border
                ${isActive 
                  ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-105" 
                  : "bg-card-body/40 text-white/50 border-white/5 hover:bg-card-body hover:text-white"
                }
              `}
            >
              <span className="text-[9px] uppercase font-bold tracking-[0.15em] opacity-70">Grupo</span>
              <span className="text-xl font-black leading-none mt-1">{group}</span>
            </button>
          )
        })}
      </div>

      {/* Lista de Partidos Filtrada */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMatches.map((p) => {
          const matchInfo: MatchInfo = {
            id: p.id,
            fase: p.fase,
            fecha: p.fecha,
            home: teamsMap[p.local] || { id: "TBD", nombre: "TBD" },
            away: teamsMap[p.visitante] || { id: "TBD", nombre: "TBD" }
          };

          return (
            <MatchPredictionCard 
              key={p.id} 
              matchInfo={matchInfo}
              userId={userId} 
            />
          );
        })}
      </div>
    </div>
  );
}
