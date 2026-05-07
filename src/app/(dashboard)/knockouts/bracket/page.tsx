"use client";
import React from 'react';
import KnockoutBracket from '@/components/tournament/KnockoutBracket';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BracketPage() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header con retorno */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/knockouts')}
            className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-white/5 group"
          >
            <ChevronLeft className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
          </button>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
              Bracket <span className="text-primary">Oficial</span>
            </h1>
            <p className="text-white/40 font-medium uppercase text-[10px] md:text-xs tracking-[0.3em]">
              Copa del Mundo 2026 | El Cuadro de la Gloria
            </p>
          </div>
        </div>
      </div>

      {/* El Componente de Bracket Refactorizado */}
      <KnockoutBracket />
    </div>
  );
}
