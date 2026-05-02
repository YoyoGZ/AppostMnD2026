"use client";

import React, { useState } from "react";
import { Trophy, Crown, Flame, Medal, ChevronRight, Copy, CheckCircle2, RefreshCw, Swords } from "lucide-react";
import { processFinishedMatches } from "@/app/actions/oracle";
import { CreateDuelModal } from "@/components/duels/CreateDuelModal";
import { DuelsColiseum, Duel } from "@/components/duels/DuelsColiseum";

type LeaderboardUser = {
  id: string;
  alias: string;
  pts: number;
  plenos: number;
  simples: number;
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

  const handleCopyLink = () => {
    if (!leagueInfo?.inviteCode) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/join/${leagueInfo.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        {form === "hot" && <Flame className="w-4 h-4 text-orange-500 animate-pulse drop-shadow-[0_0_5px_rgba(249,115,22,0.8)] mr-1 hidden md:block" />}
        {form === "ice" && <span className="text-[10px] mr-1 hidden md:block">🥶</span>}
        <div className="flex gap-1">
          {racha.map((res, idx) => (
            <div
              key={idx}
              className={`w-2 h-3.5 rounded-[2px] ${res === "W"
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                  : "bg-red-500/40"
                }`}
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
        <div className="w-14 h-14 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          <Trophy className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-2 text-white drop-shadow-md uppercase">
          {leagueInfo?.name || "La Arena"}
        </h2>
        <p className="text-primary/80 text-xs font-bold tracking-[0.2em] uppercase mb-4">
          Torneo Privado
        </p>

        {leagueInfo?.isAdmin && (
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => setIsDuelModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-yellow-500/20 border border-yellow-500/50 px-4 py-2.5 rounded-full hover:bg-yellow-500/30 transition-all active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
            >
              <Swords className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                Forjar Duelo
              </span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full hover:bg-white/10 transition-all active:scale-95"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-primary" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                {copied ? "¡Enlace Copiado!" : "Copiar Magic Link"}
              </span>
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-full hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-primary ${isSyncing ? "animate-spin" : ""}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                {isSyncing ? "Sincronizando..." : "Auditar Puntos"}
              </span>
            </button>
          </div>
        )}
      </header>

      <section className="max-w-4xl mx-auto w-full relative z-10 px-2 md:px-0">
        <DuelsColiseum duels={initialDuels} />
      </section>

      <section className="max-w-3xl mx-auto px-2 relative z-10">
        <div className="hidden md:flex items-center px-6 py-3 text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
          <div className="w-12 text-center">Pos</div>
          <div className="flex-1 pl-4">Gladiador</div>
          <div className="w-24 text-center">Racha</div>
          <div className="w-28 text-center">Efectividad</div>
          <div className="w-20 text-right pr-2">PTS</div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-20 text-white/50 text-sm font-bold uppercase tracking-widest border border-white/5 bg-black/40 rounded-2xl">Aún no hay gladiadores en tu Arena</div>
        ) : (
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
                    <span className={`font-bold truncate text-sm md:text-base ${index === 0 ? "text-yellow-400 drop-shadow-[0_0_2px_rgba(250,204,21,0.5)]" : "text-white/90"}`}>
                      {user.alias}
                    </span>
                  </div>
                  <div className="w-20 md:w-24 hidden sm:flex justify-center shrink-0">
                    {renderRacha(user.racha, user.form)}
                  </div>
                  <div className="w-24 md:w-28 flex flex-col items-center justify-center shrink-0 border-l border-white/5 pl-2 md:pl-0">
                    <span className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-wider mb-0.5">Efect</span>
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
                <div className={`transition-all duration-300 ease-in-out bg-black/40 border-t border-white/5 overflow-hidden ${selectedUser === user.id ? "max-h-32 opacity-100 py-3 px-6" : "max-h-0 opacity-0 py-0 px-6"}`}>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-white/40 uppercase tracking-wider text-[9px] mb-1">Aciertos (2 pts)</p>
                        <p className="font-bold text-green-400">{user.simples}</p>
                      </div>
                      <div>
                        <p className="text-white/40 uppercase tracking-wider text-[9px] mb-1">Plenos (5 pts)</p>
                        <p className="font-bold text-yellow-500">{user.plenos}</p>
                      </div>
                    </div>
                    <button className="flex items-center text-[10px] text-primary hover:text-white uppercase font-black tracking-widest transition-colors">
                      Ver Historial <ChevronRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 text-center flex flex-col items-center">
          <p className="text-[10px] text-white/30 uppercase tracking-[0.1em] mb-2 font-medium">Leyenda de Efectividad</p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-white/50 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="flex items-center gap-1"><span className="text-green-400">#</span> Aciertos de Resultados</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1"><span className="text-yellow-500">#</span> Resultados Exactos</span>
          </div>
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
