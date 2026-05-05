'use client'
import React, { useState } from 'react';
import { ShieldAlert, Swords, Zap, ChevronRight, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PenaltyProtocolProps {
  roundName: string;
  pointsWin: number;
  pointsLoss: number;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * PenaltyProtocol: El componente de suspenso con efecto de giro 3D épico (1.2s).
 * Incluye aclaraciones sobre el riesgo de puntos según la decisión del usuario.
 */
export default function PenaltyProtocol({
  roundName = "Octavos de Final",
  pointsWin = 6,
  pointsLoss = 3,
  onAccept,
  onDecline
}: PenaltyProtocolProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 [perspective:2500px]">
      {/* Backdrop con Blur Extremo */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-1000" />

      {/* Contenedor de la Tarjeta con Efecto Flip Épico (1200ms) */}
      <div className={cn(
        "relative w-full max-w-md aspect-[3/4] md:aspect-[4/5] transition-all duration-[1200ms] [transform-style:preserve-3d] ease-in-out",
        isFlipped ? "[transform:rotateY(180deg)]" : ""
      )}>
        
        {/* --- CARA A: SUSPENSO / INFO --- */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-[2.5rem] border border-red-500/30 bg-black shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col p-8 text-center justify-between overflow-hidden">
          {/* Glow de Peligro */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-[80px] animate-pulse" />
          
          <div className="space-y-8 pt-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 animate-bounce">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                ¡EMPATE <br/> <span className="text-red-500">TOTAL!</span>
              </h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                {roundName}
              </p>
            </div>

            <p className="text-sm text-white/60 font-medium leading-relaxed px-4">
              El tiempo reglamentario ha terminado. <br/>
              Prepárate para la definición final.
            </p>
          </div>

          <button
            onClick={() => setIsFlipped(true)}
            className="group relative w-full bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-[length:200%_auto] hover:bg-right transition-all duration-700 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(220,38,38,0.4)]"
          >
            Toca para ver la definición <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* --- CARA B: EL REDOBLE / ACCIÓN --- */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2.5rem] border border-red-500/30 bg-black shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col p-8 text-center justify-between overflow-hidden">
          {/* Glow de Acción */}
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-[80px]" />

          <div className="space-y-8 pt-4">
            <div className="space-y-2">
              <div className="flex justify-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-yellow-500 font-black text-[9px] uppercase tracking-[0.4em]">Protocolo de Riesgo</span>
                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </div>
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                ¿REDOBLAR <br/> <span className="text-red-500">APUESTA?</span>
              </h3>
            </div>

            {/* Grid de Riesgo/Recompensa */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-1">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Si Ganas</span>
                <div className="text-4xl font-black text-green-400">+{pointsWin}</div>
                <span className="text-[8px] font-bold text-green-400/50 uppercase">PUNTOS</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-1">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Si Pierdes</span>
                <div className="text-4xl font-black text-red-500">-{pointsLoss}</div>
                <span className="text-[8px] font-bold text-red-500/50 uppercase">PUNTOS</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onAccept}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:bg-red-500 transition-colors flex items-center justify-center gap-3"
              >
                <Swords className="w-4 h-4" /> Aceptar Redoble
              </button>
              
              <button
                onClick={onDecline}
                className="w-full bg-white/5 text-white/40 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/5"
              >
                <XCircle className="w-4 h-4" /> Mantener Original
              </button>
            </div>
          </div>

          <div className="pb-2">
            <p className="text-[10px] text-white/70 font-black uppercase leading-tight bg-white/5 py-4 px-5 rounded-2xl border border-white/10 flex items-center gap-3 text-left">
              <Info className="w-8 h-8 text-primary shrink-0" />
              <span>
                El Ganador se lleva los puntos y la medalla, <br/>
                <span className="text-primary">vos no perdés puntos del acumulado.</span>
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
