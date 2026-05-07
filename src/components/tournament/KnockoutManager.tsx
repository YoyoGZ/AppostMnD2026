
"use client";

import React, { useState, useEffect } from "react";
import { calculateGroupStandings, getBestThirdPlaces } from "@/app/actions/tournament-engine";
import { TeamStanding } from "@/types/tournament";
import { getTeamFlagUrl } from "@/lib/utils/flags";
import { Swords, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

import { useRouter } from "next/navigation";

interface KnockoutManagerProps {
  isAdmin?: boolean;
}

export default function KnockoutManager({ isAdmin = false }: KnockoutManagerProps) {
  const router = useRouter();
  const [standings, setStandings] = useState<Record<string, TeamStanding[]>>({});
  const [bestThirds, setBestThirds] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedMatches, setDeployedMatches] = useState<number[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const s = await calculateGroupStandings();
      const t = await getBestThirdPlaces(s);
      setStandings(s);
      setBestThirds(t);

      // Verificar qué partidos ya están en la DB
      const { data } = await supabase.from('match_results').select('id').gte('id', 73);
      if (data) setDeployedMatches(data.map(m => m.id));
      
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleDeploy = async () => {
    if (!confirm("¿Estás seguro de publicar los cruces de Eliminatorias? Esto abrirá las apuestas para todos los usuarios.")) return;
    setIsDeploying(true);
    
    try {
      // Importamos dinámicamente la acción del servidor para evitar problemas de cliente/servidor
      const { promoteTeamsToRoundOf32 } = await import("@/app/actions/tournament-engine");
      const res = await promoteTeamsToRoundOf32();
      if (res.success) {
        alert("¡Cruces desplegados con éxito!");
        window.location.reload();
      }
    } catch (error) {
      alert("Error al desplegar cruces.");
    } finally {
      setIsDeploying(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Calculando llaves oficiales...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header de Control (Solo Admin) */}
      {isAdmin && (
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic">Panel de Control de Llaves</h3>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Auditoría Pre-Despliegue | FIFA 2026</p>
            </div>
          </div>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-tighter rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50"
          >
            {isDeploying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
            Desplegar a la Arena
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview de Partidos de 16avos */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} order-1 space-y-6`}>
          <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/80 px-2 flex items-center gap-2">
            <Swords className="w-4 h-4" /> {isAdmin ? 'Cruces Proyectados' : 'Llave de Eliminatorias'} (Round of 32)
          </h4>
          <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-4`}>
            {[
              { id: 73, h: standings['E']?.[0], a: bestThirds[4] }, // Ganador E vs 3ro (Slot E/F...)
              { id: 74, h: standings['I']?.[0], a: bestThirds[3] }, // Ganador I vs 3ro
              { id: 75, h: standings['A']?.[1], a: standings['B']?.[1] }, // 2do A vs 2do B
              { id: 76, h: standings['F']?.[0], a: standings['C']?.[1] }, // Ganador F vs 2do C
              { id: 77, h: standings['K']?.[1], a: standings['L']?.[1] }, // 2do K vs 2do L
              { id: 78, h: standings['H']?.[0], a: standings['J']?.[1] }, // Ganador H vs 2do J
              { id: 79, h: standings['D']?.[0], a: bestThirds[5] }, // Ganador D vs 3ro
              { id: 80, h: standings['G']?.[0], a: bestThirds[2] }, // Ganador G vs 3ro
              { id: 81, h: standings['C']?.[0], a: standings['F']?.[1] }, // Ganador C vs 2do F
              { id: 82, h: standings['E']?.[1], a: standings['I']?.[1] }, // 2do E vs 2do I
              { id: 83, h: standings['A']?.[0], a: bestThirds[7] }, // Ganador A vs 3ro
              { id: 84, h: standings['L']?.[0], a: bestThirds[1] }, // Ganador L vs 3ro
              { id: 85, h: standings['J']?.[0], a: standings['H']?.[1] }, // Ganador J vs 2do H
              { id: 86, h: standings['D']?.[1], a: standings['G']?.[1] }, // 2do D vs 2do G
              { id: 87, h: standings['B']?.[0], a: bestThirds[6] }, // Ganador B vs 3ro
              { id: 88, h: standings['K']?.[0], a: bestThirds[0] }  // Ganador K vs 3ro
            ].map(m => {
              const isDeployed = deployedMatches.includes(m.id);
              return (
                <div key={m.id} className={`p-5 rounded-[2rem] border-2 flex flex-col gap-4 transition-all duration-300 ${isDeployed ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.03] border-white/10 opacity-70"}`}>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Partido #{m.id}</span>
                      {isDeployed && (
                        <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span className="text-[8px] font-black text-green-400 uppercase">Activo</span>
                        </div>
                      )}
                   </div>
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                         {m.h && <img src={getTeamFlagUrl(m.h.teamId)!} className="w-7 h-4.5 object-cover rounded-sm shadow-sm" />}
                         <span className="text-sm font-black text-white/90 truncate tracking-tight">{m.h?.nombre || 'TBD'}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <span className="text-[10px] font-black text-white/20 italic">VS</span>
                      </div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 justify-end text-right">
                         <span className="text-sm font-black text-white/90 truncate tracking-tight">{m.a?.nombre || 'TBD'}</span>
                         {m.a && <img src={getTeamFlagUrl(m.a.teamId)!} className="w-7 h-4.5 object-cover rounded-sm shadow-sm" />}
                      </div>
                   </div>

                   {/* Botón de Acción Condicional (Visible si hay enfrentamiento) */}
                   {!isAdmin && m.h && m.a && (
                     <button 
                       onClick={() => router.push('/knockouts/bracket')}
                       className="w-full mt-2 py-3 bg-primary/10 hover:bg-primary text-white hover:text-primary-foreground border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(251,191,36,0)] hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                     >
                       Ir a Pronóstico
                     </button>
                   )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Ranking de Mejores Terceros (Solo Admin) */}
        {isAdmin && (
          <div className="lg:col-span-1 order-2 space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-400/80 px-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Clasificación de Terceros
            </h4>
            <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl shadow-2xl">
              <div className="p-5 flex flex-col gap-2.5">
                {bestThirds.map((team, idx) => (
                  <div key={team.teamId} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${idx < 8 ? "bg-primary/10 border-primary/20 shadow-lg" : "bg-white/5 border-white/5 opacity-50 grayscale"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black w-5 ${idx < 8 ? "text-primary" : "text-white/20"}`}>{idx + 1}</span>
                      <img src={getTeamFlagUrl(team.teamId)!} className="w-6 h-4 object-cover rounded-sm" alt="" />
                      <span className={`text-xs font-bold ${idx < 8 ? "text-white" : "text-white/40"}`}>{team.nombre}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col items-end">
                        <span className={`text-[11px] font-black ${idx < 8 ? "text-green-400" : "text-white/20"}`}>{team.pts} PTS</span>
                        <span className="text-[9px] font-bold text-white/30">{team.dg} DG</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
