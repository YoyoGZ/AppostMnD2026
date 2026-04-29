import React from "react";
import { cn } from "@/lib/utils";
import { DashboardMatchProps } from "@/types/tournament";

export function MatchCard({
  homeTeam,
  homeFlag,
  awayTeam,
  awayFlag,
  status,
  date,
  initialHomeScore,
  initialAwayScore,
}: DashboardMatchProps) {
  // Styles based on status
  const statusConfig = {
    pending: { label: "Pendiente", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
    playing: { label: "En Juego", color: "bg-success/20 text-success", dot: "bg-success animate-pulse" },
    finished: { label: "Finalizado", color: "bg-foreground/10 text-foreground/70", dot: "bg-foreground/50" },
  };

  const isReadOnly = status === "finished";

  return (
    <article className={cn("match-card flex-col gap-4", isReadOnly && "opacity-80")}>
      {/* Header: Date & Status */}
      <div className="w-full flex justify-between items-center text-xs font-semibold">
        <span className="text-muted-foreground">{date || "TBD"}</span>
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full", statusConfig[status].color)}>
          <span className={cn("w-2 h-2 rounded-full", statusConfig[status].dot)} />
          {statusConfig[status].label}
        </div>
      </div>

      {/* Main Content: Teams & Scores */}
      <div className="w-full flex items-center justify-between">
        
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <span className="text-3xl" role="img" aria-label={homeTeam}>{homeFlag}</span>
          <span className="font-medium text-sm truncate w-full text-center">{homeTeam}</span>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3 px-4">
          <input
            type="number"
            min="0"
            max="20"
            defaultValue={initialHomeScore}
            disabled={isReadOnly}
            className="score-input"
            aria-label={`Resultado de ${homeTeam}`}
            placeholder="-"
          />
          <span className="text-muted-foreground font-bold">-</span>
          <input
            type="number"
            min="0"
            max="20"
            defaultValue={initialAwayScore}
            disabled={isReadOnly}
            className="score-input"
            aria-label={`Resultado de ${awayTeam}`}
            placeholder="-"
          />
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <span className="text-3xl" role="img" aria-label={awayTeam}>{awayFlag}</span>
          <span className="font-medium text-sm truncate w-full text-center">{awayTeam}</span>
        </div>

      </div>
    </article>
  );
}
