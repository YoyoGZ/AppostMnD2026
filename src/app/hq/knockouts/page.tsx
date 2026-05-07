"use client";
import React from 'react';
import KnockoutManager from '@/components/tournament/KnockoutManager';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HQKnockoutsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      {/* Header Minimalista Admin */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push('/hq')}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
        >
          <ChevronLeft className="w-6 h-6 text-white/40" />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Motor de Eliminatorias</h1>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest">Auditoría Nivel Super Admin</p>
        </div>
      </div>

      <KnockoutManager isAdmin={true} />
    </div>
  );
}
