"use client";

import React, { useState, useEffect } from "react";
import worldCupData from "@/data/world-cup-2026.json";
import { GroupsCarousel } from "@/components/tournament/GroupsCarousel";
import { MatchPredictionCard } from "@/components/tournament/MatchPredictionCard";
import Modal from "@/components/ui/Modal";
import ArenaRules from "@/components/tournament/ArenaRules";
import { Info } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function Dashboard() {
  const [activeGroup, setActiveGroup] = useState("A");
  const [showRules, setShowRules] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  // 1. Organizar grupos en orden alfabético
  const groupedTeams = worldCupData.equipos.reduce((acc: any, team: any) => {
    if (!acc[team.grupo]) {
      acc[team.grupo] = [];
    }
    acc[team.grupo].push(team);
    return acc;
  }, {});

  const groupsData = Object.keys(groupedTeams)
    .sort() // alfabético A-L
    .map((letter) => ({
      letter,
      teams: groupedTeams[letter],
    }));

  // 2. Filtrar próximos partidos para el grupo activo (Motor Temporal)
  const groupMatches = worldCupData.partidos.filter((m: any) => m.grupo === activeGroup);
  
  // Usar fecha actual para ver cuáles ya pasaron (sumamos 2 horas de duración del partido)
  const now = new Date();
  let upcomingMatches = groupMatches.filter(
    (m: any) => new Date(m.fecha).getTime() + (2 * 60 * 60 * 1000) > now.getTime()
  );

  // Si todos pasaron, mostramos los últimos
  if (upcomingMatches.length === 0) {
    upcomingMatches = groupMatches.slice(-2);
  }

  // Identificamos cuál es la "Próxima Fase" (J1, J2 o J3) en base al primer partido no finalizado
  const nextFase = upcomingMatches[0]?.fase;
  const filteredMatches = upcomingMatches.filter((m: any) => m.fase === nextFase);

  return (
    <div className="relative pb-12">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none" />

      <header className="mb-10 pt-4 md:pt-0 relative z-10 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 text-title drop-shadow-[0_2px_10px_rgba(56,189,248,0.3)]">Copa Mundial FIFA 2026</h2>
          <p className="text-white/60 text-sm font-medium">Dashboard General de tu Equipo</p>
        </div>

        <button 
          onClick={() => setShowRules(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all group"
        >
          <Info className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          Reglas
        </button>
      </header>

      <Modal 
        isOpen={showRules} 
        onClose={() => setShowRules(false)} 
        title="Reglas de la Arena"
      >
        <ArenaRules />
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
