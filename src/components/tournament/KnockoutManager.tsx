"use client";

import React, { useState, useEffect } from "react";
import { 
  Swords, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  RefreshCw, 
  Play,
  HelpCircle
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import knockoutData from "@/data/knockouts-simulation.json";
import worldCupData from "@/data/world-cup-2026.json";
import { getTeamFlagUrl, normalizeFIFAId } from "@/lib/utils/flags";
import { promoteTeamsToRoundOf32, advanceActiveRoundWinnersAction } from "@/app/actions/tournament-engine";
import { syncKnockoutRoundAction } from "@/app/actions/sync";

const getTeamName = (teamId: string | null) => {
  if (!teamId || teamId === 'TBD') return 'TBD';
  const id = normalizeFIFAId(teamId);
  const team = worldCupData.equipos.find(t => t.id === id);
  return team ? team.nombre : id;
};

interface KnockoutManagerProps {
  isAdmin?: boolean;
}

interface DBResult {
  id: number;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

export default function KnockoutManager({ isAdmin = false }: KnockoutManagerProps) {
  const [activeTab, setActiveTab] = useState<string>("r32"); // r32, r16, qf, sf, final
  const [dbResults, setDbResults] = useState<DBResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [manualWinners, setManualWinners] = useState<Record<number, string>>({});
  
  const supabase = createClient();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select('id, home_team_id, away_team_id, home_score, away_score, status')
        .gte('id', 73)
        .order('id', { ascending: true });

      if (!error && data) {
        setDbResults(data as DBResult[]);
      }
    } catch (e) {
      console.error("Error cargando base de datos:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeployInitial = async () => {
    if (!confirm("¿Estás seguro de publicar los cruces iniciales de 16avos? Esto abrirá las apuestas de esta ronda para todos los usuarios.")) return;
    setIsDeploying(true);
    try {
      const res = await promoteTeamsToRoundOf32();
      if (res.success) {
        alert("¡Cruces de 16avos desplegados con éxito!");
        await loadData();
      } else {
        alert("Error: " + res.error);
      }
    } catch (e) {
      alert("Error inesperado de red.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSyncRound = async () => {
    setIsSyncing(true);
    try {
      const res = await syncKnockoutRoundAction(activeTab);
      if (res.success) {
        alert(`Sincronización de marcadores completa. Partidos actualizados: ${res.updatedCount}`);
        await loadData();
      } else {
        alert("Error de sincronización: " + res.error);
      }
    } catch (e) {
      alert("Error de conexión con el sincronizador.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdvanceRound = async () => {
    const roundName = knockoutData.rondas.find(r => r.id === activeTab)?.nombre || activeTab;
    if (!confirm(`¿Estás seguro de avanzar y consolidar los ganadores de la ronda '${roundName}' hacia la siguiente fase?`)) return;

    setIsAdvancing(true);
    try {
      const res = await advanceActiveRoundWinnersAction(activeTab, manualWinners);
      if (res.success) {
        alert(`¡Avance exitoso! Se actualizaron e inyectaron ${res.advancedCount} partidos en la siguiente ronda.`);
        await loadData();
      } else {
        alert("Error al avanzar llaves: " + res.error);
      }
    } catch (e) {
      alert("Error de red al procesar el avance.");
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleSelectManualWinner = (matchId: number, teamId: string) => {
    setManualWinners(prev => ({
      ...prev,
      [matchId]: teamId
    }));
  };

  // Filtrado de partidos locales según la pestaña
  const currentRoundMeta = knockoutData.rondas.find(r => r.id === activeTab);
  const currentRoundMatches = currentRoundMeta?.partidos || [];

  // Mapear con datos de la BD
  const roundMatchesWithResults = currentRoundMatches.map(m => {
    const dbMatch = dbResults.find(db => db.id === m.id);
    return {
      ...m,
      home_team_id: dbMatch?.home_team_id || (m as any).home_team_id || 'TBD',
      away_team_id: dbMatch?.away_team_id || (m as any).away_team_id || 'TBD',
      home_score: dbMatch?.home_score ?? null,
      away_score: dbMatch?.away_score ?? null,
      status: dbMatch?.status || 'pending',
      isDeployed: !!dbMatch
    };
  });

  const isR32Deployed = dbResults.length > 0;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Cargando consola de eliminatorias...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Admin de Despliegue Inicial (si no está desplegado) */}
      {isAdmin && !isR32Deployed && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Cruces de 16avos Pendientes de Despliegue</h3>
              <p className="text-xs text-white/40 font-medium leading-relaxed">
                Debes inicializar el bracket publicando la ronda de 16avos de final en la base de datos para habilitar las apuestas de los usuarios.
              </p>
            </div>
          </div>
          <button
            onClick={handleDeployInitial}
            disabled={isDeploying}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 cursor-pointer"
          >
            {isDeploying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4" />}
            Desplegar 16avos
          </button>
        </div>
      )}

      {/* Tabs de Rondas */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {knockoutData.rondas.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveTab(r.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
              activeTab === r.id
                ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
            }`}
          >
            {r.nombre}
          </button>
        ))}
      </div>

      {/* Controles de Consola Admin (Solo si 16avos está desplegado e isAdmin) */}
      {isAdmin && isR32Deployed && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-md font-black uppercase tracking-wide">
              Controles de {currentRoundMeta?.nombre}
            </h3>
            <p className="text-xs text-white/40 font-medium">
              Sincronizá los partidos con la API o avanzá a los ganadores hacia la próxima ronda de llaves.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleSyncRound}
              disabled={isSyncing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Sync con API
            </button>
            <button
              onClick={handleAdvanceRound}
              disabled={isAdvancing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl hover:scale-102 active:scale-98 transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)] cursor-pointer disabled:opacity-50"
            >
              {isAdvancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
              Calcular & Avanzar
            </button>
          </div>
        </div>
      )}

      {/* Listado de partidos de la ronda */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/80 px-2 flex items-center gap-2">
          <Swords className="w-4 h-4" /> Partidos Programados ({roundMatchesWithResults.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roundMatchesWithResults.map(m => {
            const hasTeams = m.home_team_id !== 'TBD' && m.away_team_id !== 'TBD';
            const isFinished = m.status === 'finished';
            const isPlaying = !isFinished && m.status !== 'pending' && m.status !== 'bloqueado';
            const isTie = isFinished && m.home_score === m.away_score;
            
            return (
              <div 
                key={m.id} 
                className={`p-6 rounded-[2.5rem] border transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden ${
                  isPlaying 
                    ? "bg-red-500/5 border-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.05)]"
                    : isFinished
                      ? "bg-green-500/5 border-green-500/20"
                      : m.isDeployed 
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20" 
                        : "bg-white/[0.01] border-white/5 opacity-55"
                }`}
              >
                {/* Cabecera de la Card */}
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Partido #{m.id}</span>
                  <div className="flex items-center gap-1.5">
                    {isPlaying && (
                      <span className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-red-400 uppercase tracking-widest animate-pulse">
                        En Vivo
                      </span>
                    )}
                    {isFinished && (
                      <span className="flex items-center gap-1 bg-green-500/20 px-2 py-0.5 rounded-full text-[8px] font-black text-green-400 uppercase tracking-widest">
                        Finalizado
                      </span>
                    )}
                    {!m.isDeployed && (
                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full text-[8px] font-black text-white/30 uppercase tracking-widest">
                        No Desplegado
                      </span>
                    )}
                    {m.isDeployed && m.status === 'pending' && (
                      <span className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Cuerpo de equipos */}
                <div className="space-y-4">
                  {/* Local */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {m.home_team_id !== 'TBD' ? (
                        <>
                          <img src={getTeamFlagUrl(m.home_team_id)!} className="w-7 h-4.5 object-cover rounded shadow-sm shrink-0" alt="" />
                          <span className="text-sm font-black text-white truncate tracking-tight">{getTeamName(m.home_team_id)}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-7 h-4.5 bg-white/5 rounded border border-white/10 shrink-0 flex items-center justify-center">
                            <HelpCircle className="w-3.5 h-3.5 text-white/20" />
                          </div>
                          <span className="text-sm font-bold text-white/30 truncate italic tracking-tight">{m.home_placeholder}</span>
                        </>
                      )}
                    </div>
                    {isFinished && (
                      <span className={`text-md font-black ${m.home_score! >= m.away_score! ? 'text-white' : 'text-white/40'}`}>
                        {m.home_score}
                      </span>
                    )}
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {m.away_team_id !== 'TBD' ? (
                        <>
                          <img src={getTeamFlagUrl(m.away_team_id)!} className="w-7 h-4.5 object-cover rounded shadow-sm shrink-0" alt="" />
                          <span className="text-sm font-black text-white truncate tracking-tight">{getTeamName(m.away_team_id)}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-7 h-4.5 bg-white/5 rounded border border-white/10 shrink-0 flex items-center justify-center">
                            <HelpCircle className="w-3.5 h-3.5 text-white/20" />
                          </div>
                          <span className="text-sm font-bold text-white/30 truncate italic tracking-tight">{m.away_placeholder}</span>
                        </>
                      )}
                    </div>
                    {isFinished && (
                      <span className={`text-md font-black ${m.away_score! >= m.home_score! ? 'text-white' : 'text-white/40'}`}>
                        {m.away_score}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones de Empate y Definición de Penales (Solo Admin en Partidos Empatados) */}
                {isAdmin && isTie && hasTeams && (
                  <div className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-2">
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Empate en penales: Definí el ganador
                    </span>
                    <select
                      value={manualWinners[m.id] || ""}
                      onChange={(e) => handleSelectManualWinner(m.id, e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-amber-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                    >
                      <option value="" disabled>-- Selecciona Ganador --</option>
                      <option value={m.home_team_id}>{getTeamName(m.home_team_id)} (Clasifica)</option>
                      <option value={m.away_team_id}>{getTeamName(m.away_team_id)} (Clasifica)</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
