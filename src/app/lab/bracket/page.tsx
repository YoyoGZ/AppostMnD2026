'use client'
import React, { useState } from 'react';
import KnockoutBracket from '@/components/tournament/KnockoutBracket';
import PenaltyProtocol from '@/components/duels/PenaltyProtocol';
import { Trophy, ChevronLeft, Zap, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { processFinishedMatches } from '@/app/actions/oracle';

export default function BracketLabPage() {
  const [showPenalty, setShowPenalty] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunOracle = async () => {
    setIsProcessing(true);
    try {
      const res = await processFinishedMatches();
      alert(res.message);
    } catch (err) {
      console.error(err);
      alert("Error ejecutando el Oráculo");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
      {/* Header de Navegación */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/hq" className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver al HQ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-sm font-black uppercase tracking-[0.4em]">Laboratorio de Brackets</h1>
          </div>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
            Fase 7: Prototipo Visual
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic italic">
            El Camino del <span className="text-primary">Campeón</span>
          </h2>
          <p className="max-w-xl mx-auto text-white/40 text-sm font-medium leading-relaxed px-6">
            Visualización técnica de las llaves eliminatorias del Mundial 2026. 
            Navegación escalonada y placeholders dinámicos.
          </p>
        </div>
      </section>

      {/* Bracket Component */}
      <section className="pb-32">
        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => setShowPenalty(true)}
            className="flex items-center gap-2 bg-red-600/10 border border-red-600/30 px-6 py-3 rounded-full text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-600/20 transition-all"
          >
            <Zap className="w-4 h-4 fill-red-500" /> Simular Empate (Penales)
          </button>

          <button 
            onClick={handleRunOracle}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-6 py-3 rounded-full text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            Ejecutar Oráculo (Avance)
          </button>
        </div>
        <KnockoutBracket />
      </section>

      {/* Penalty Protocol Overlay */}
      {showPenalty && (
        <PenaltyProtocol 
          roundName="Octavos de Final"
          pointsWin={6}
          pointsLoss={3}
          onAccept={() => {
            alert("¡Has aceptado el desafío! Los puntos se han redoblado.");
            setShowPenalty(false);
          }}
          onDecline={() => {
            alert("Has rechazado el redoble. Esperando decisión del oponente.");
            setShowPenalty(false);
          }}
        />
      )}

      {/* Footer / Info */}
      <footer className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl pointer-events-auto">
            <p className="text-[10px] text-white/40 font-bold uppercase leading-tight">
              Modo de Simulación Activo <br/>
              <span className="text-primary">Fuente: knockouts-simulation.json</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
