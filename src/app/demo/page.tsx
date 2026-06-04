"use client";

import React, { useState } from "react";
import worldCupData from "@/data/world-cup-2026.json";
import { GroupsCarousel } from "@/components/tournament/GroupsCarousel";
import { MatchPredictionCard } from "@/components/tournament/MatchPredictionCard";
import Modal from "@/components/ui/Modal";
import LigaRules from "@/components/tournament/LigaRules";
import { Info, Lock, Play, ChevronLeft } from "lucide-react";
import { SidebarProvider } from "@/context/SidebarContext";
import { Shell } from "@/components/layout/Shell";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Datos falsos para que la tabla no se vea en cero
const mockStandings = [
  { team: { id: "ARG", name: "Argentina" }, points: 9, group: "Grupo A" },
  { team: { id: "MEX", name: "México" }, points: 7, group: "Grupo B" },
  { team: { id: "ESP", name: "España" }, points: 6, group: "Grupo E" },
  { team: { id: "FRA", name: "Francia" }, points: 9, group: "Grupo F" },
  { team: { id: "BRA", name: "Brasil" }, points: 7, group: "Grupo G" },
];

export default function DemoPage() {
  const [activeGroup, setActiveGroup] = useState("A");
  const [showRules, setShowRules] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const router = useRouter();

  // 1. Organizar grupos en orden alfabético
  const groupedTeams = worldCupData.equipos.reduce((acc: any, team: any) => {
    if (!acc[team.grupo]) acc[team.grupo] = [];
    acc[team.grupo].push(team);
    return acc;
  }, {});

  const groupsData = Object.keys(groupedTeams)
    .sort()
    .map((letter) => {
      const mappedTeams = groupedTeams[letter].map((team: any) => {
        const teamStanding = mockStandings.find((s: any) => s.team.id === team.id);
        return {
          ...team,
          pts: teamStanding ? teamStanding.points : 0
        };
      });
      mappedTeams.sort((a: any, b: any) => b.pts - a.pts);
      return { letter, teams: mappedTeams };
    });

  const groupMatches = worldCupData.partidos.filter((m: any) => m.grupo === activeGroup).slice(0, 2);

  return (
    <SidebarProvider>
      <div 
        className="w-full min-h-screen relative"
        onClickCapture={(e) => {
          const target = e.target as HTMLElement;
          // Dejar pasar clics si son el carrusel, reglas, o volver atrás
          if (
            target.closest('.group-carousel-allow') || 
            target.closest('.rules-btn-allow') || 
            target.closest('.back-btn-allow')
          ) {
            return;
          }
          
          // Bloquear clics en sidebar, links (excepto los permitidos), botones e inputs
          if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('aside')) {
            e.preventDefault();
            e.stopPropagation();
            setShowPaywall(true);
          }
        }}
      >
        <Shell 
          activeLeague={{ id: "demo-123", name: "La Liga de D10S", isCaptain: false }} 
          allLeagues={[{ id: "demo-123", name: "La Liga de D10S", isCaptain: false }]}
        >
          {/* Top Bar for Demo */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="back-btn-allow flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full transition-all group z-50">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ChevronLeft className="w-3 h-3 text-red-400" />
              </div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-red-400">Salir de Demo</span>
            </Link>

            <div className="bg-primary/20 border border-primary/50 text-primary px-4 py-2 rounded-xl flex items-center justify-center gap-3 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.15)] z-50">
              <Play className="w-4 h-4 fill-primary" />
              <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Modo Vidriera Interactivo</span>
              <span className="text-[11px] font-black uppercase tracking-widest sm:hidden">Modo Demo</span>
            </div>
          </div>

          <div className="relative pb-12">
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none" />

            <header className="mb-10 pt-4 md:pt-0 relative z-10 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 text-white drop-shadow-[0_2px_10px_rgba(56,189,248,0.3)]">
                  Mundial de Norteamérica
                </h2>
                <p className="text-white/60 text-sm font-medium">Dashboard General de tu Equipo</p>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <button 
                  onClick={() => setShowRules(true)}
                  className="rules-btn-allow flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[11px] md:text-xs font-black uppercase tracking-[0.15em] text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(251,191,36,0.1)] transition-all group w-fit"
                >
                  <Info className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  Reglas
                </button>
              </div>
            </header>

            <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="Reglas de la Liga">
              <div className="paywall-modal-content">
                <LigaRules />
              </div>
            </Modal>

            <section className="mb-16 relative z-10 group-carousel-allow">
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
                {groupMatches.map((match: any) => {
                  const homeTeam = worldCupData.equipos.find((t: any) => t.id === match.local) || { id: match.local, nombre: "TBD" };
                  const awayTeam = worldCupData.equipos.find((t: any) => t.id === match.visitante) || { id: match.visitante, nombre: "TBD" };

                  return (
                    <div key={match.id} className="w-full md:w-[420px] transform transition-all duration-500 hover:translate-y-[-4px] cursor-pointer">
                      {/* Envolvemos en pointer-events-none para que cualquier clic caiga en el wrapper principal y dispare el CTA */}
                      <div className="pointer-events-none">
                        <MatchPredictionCard
                          matchInfo={{
                            id: match.id,
                            fase: match.fase,
                            fecha: match.fecha,
                            home: homeTeam,
                            away: awayTeam,
                          }}
                          userId={null}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </Shell>
      </div>

      {/* Modal de Paywall Interceptado (Fuera del div interceptor) */}
      <Modal isOpen={showPaywall} onClose={() => setShowPaywall(false)} title="Acceso Exclusivo">
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6">
             <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Estás en Modo Demo</h3>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            La vidriera te deja ver la interfaz, pero para interactuar con la app (Sidebar, chatear, ingresar pronósticos) tenés que crear tu liga.
          </p>
          <Link href="/login?mode=register" className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
             Comprar Founder Pass <Lock className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </Modal>
    </SidebarProvider>
  );
}
