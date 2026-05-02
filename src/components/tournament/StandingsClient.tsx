"use client";

import React, { useState } from "react";
import { Trophy, Crown, Flame, Medal, ChevronRight, Copy, CheckCircle2, RefreshCw, Swords, Trash2 } from "lucide-react";
import { processFinishedMatches } from "@/app/actions/oracle";
import { archiveDuelsAction } from "@/app/actions/duels";
import { CreateDuelModal } from "@/components/duels/CreateDuelModal";
import { DuelsColiseum, Duel } from "@/components/duels/DuelsColiseum";

type LeaderboardUser = {
  id: string;
  alias: string;
  pts: number;
  plenos: number;
  simples: number;
  duelosGanados: number;
  racha: string[];
  form: string;
};

export default function StandingsClient({
  leaderboard,
  leagueInfo,
  initialDuels = []
}: {
  leaderboard: LeaderboardUser[],
  leagueInfo?: { id: string, name: string, inviteCode: string, isAdmin: boolean },
  initialDuels?: Duel[]
}) {
  const [isDuelModalOpen, setIsDuelModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await processFinishedMatches();
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error sincronizando:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleArchive = async () => {
    if (!leagueInfo?.id) return;
    if (!confirm("¿Quieres limpiar los duelos antiguos de la Arena? Solo quedarán los 3 más recientes. Todos se guardarán en las Crónicas históricas.")) return;
    
    setIsSyncing(true);
    try {
      const result = await archiveDuelsAction(leagueInfo.id);
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error archivando:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyLink = () => {
    if (!leagueInfo?.inviteCode) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/join/${leagueInfo.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // LÓGICA DE FILTRADO: Todos los Activos + Los 3 últimos Resueltos
  const activeArenaDuels = React.useMemo(() => {
    const active = initialDuels.filter(d => d.status === 'active');
    const resolved = initialDuels
      .filter(d => d.status === 'resolved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    return [...active, ...resolved];
  }, [initialDuels]);

  const getPositionStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-r from-yellow-500/20 to-amber-600/5 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/30 scale-[1.02] z-10 relative";
    if (index === 1) return "bg-gradient-to-r from-slate-300/10 to-transparent border-slate-300/30";
    if (index === 2) return "bg-gradient-to-r from-orange-700/10 to-transparent border-orange-700/30";
    return "bg-card-body/20 border-white/5 hover:bg-white/5";
  };

  const getPositionIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-white/30 font-black w-5 text-center">{index + 1}</span>;
  };

  const renderRacha = (racha: string[], form: string) => {
    return (
      <div className="flex items-center gap-1.5">
        {form === "hot" && <Flame className="w-4 h-4 text-orange-500 animate-pulse mr-1 hidden md:block" />}
        {form === "ice" && <span className="text-[10px] mr-1 hidden md:block">🥶</span>}
        <div className="flex gap-1">
          {racha.map((res, idx) => (
            <div
              key={idx}
              className={`w-2 h-3.5 rounded-[2px] ${res === "W" ? "bg-green-500" : "bg-red-500/40"}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative pb-24">
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-primary/5 via-black to-black -z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <header className="mb-8 pt-4 md:pt-0 relative z-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
          <Trophy className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-2 text-white uppercase">
          {leagueInfo?.name || "La Arena"}
        </h2>
        
        {leagueInfo?.isAdmin && (
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              onClick={() => setIsDuelModalOpen(true)}
              className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 rounded-full hover:bg-yellow-500/30 transition-all text-[10px] font-black uppercase text-yellow-400"
            >
              <Swords className="w-4 h-4" /> Forjar Duelo
            </button>
            
            <button
              onClick={handleArchive}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-full hover:bg-red-500/20 transition-all text-[10px] font-black uppercase text-red-400 disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" /> Limpiar Arena
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/20 transition-all text-[10px] font-black uppercase text-primary"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} /> Auditar
            </button>
          </div>
        )}
      </header>

      <section className="max-w-4xl mx-auto w-full relative z-10 px-2 md:px-0 mb-12">
        <DuelsColiseum duels={activeArenaDuels} />
      </section>

      <section className="max-w-4xl mx-auto px-2 relative z-10">
        {/* Table Header */}
        <div className="hidden md:flex items-center px-6 py-3 text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
          <div className="w-12 text-center">Pos</div>
          <div className="flex-1 pl-4">Gladiador</div>
          <div className="w-20 text-center">Duelos</div>
          <div className="w-24 text-center">Racha</div>
          <div className="w-28 text-center">Efectividad</div>
          <div className="w-20 text-right pr-2">PTS</div>
        </div>

        <div className="flex flex-col gap-3">
          {leaderboard.map((user, index) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
              className={`flex flex-col rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer overflow-hidden ${getPositionStyle(index)}`}
            >
              <div className="flex items-center h-16 md:h-18 px-4 md:px-6">
                <div className="w-8 md:w-12 flex justify-center items-center shrink-0">
                  {getPositionIcon(index)}
                </div>
                <div className="flex-1 flex items-center gap-3 md:gap-4 pl-2 md:pl-4 overflow-hidden">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black uppercase shrink-0 ${index === 0 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/30" : "bg-white/10 text-white"}`}>
                    {user.alias.substring(0, 2)}
                  </div>
                  <span className={`font-bold truncate text-sm md:text-base ${index === 0 ? "text-yellow-400" : "text-white/90"}`}>
                    {user.alias}
                  </span>
                </div>

                {/* Duelos Ganados */}
                <div className="w-16 md:w-20 flex flex-col items-center justify-center shrink-0 border-l border-white/5 md:border-none">
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/20">
                    <span className="text-xs font-black text-yellow-500">{user.duelosGanados}</span>
                    <Swords className="w-3.5 h-3.5 text-yellow-500" />
                  </div>
                </div>

                <div className="w-20 md:w-24 hidden sm:flex justify-center shrink-0">
                  {renderRacha(user.racha, user.form)}
                </div>
                <div className="w-24 md:w-28 flex flex-col items-center justify-center shrink-0 border-l border-white/5 pl-2 md:pl-0">
                  <div className="flex items-center gap-1.5 text-xs font-black text-white/80">
                    <span className="text-green-400">{user.simples}</span>
                    <span className="text-white/20">/</span>
                    <span className="text-yellow-500">{user.plenos}</span>
                  </div>
                </div>
                <div className="w-16 md:w-20 flex justify-end shrink-0 pl-4 border-l border-white/5">
                  <span className={`text-xl md:text-2xl font-black ${index === 0 ? "text-yellow-400" : "text-white"}`}>
                    {user.pts}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {leagueInfo && leagueInfo.isAdmin && (
        <CreateDuelModal
          isOpen={isDuelModalOpen}
          onClose={() => setIsDuelModalOpen(false)}
          leagueId={leagueInfo.id}
          members={leaderboard.map(u => ({ userId: u.id, alias: u.alias }))}
        />
      )}
    </div>
  );
}
