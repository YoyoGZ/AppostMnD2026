"use client";
import React, { useEffect, useState } from 'react';
import KnockoutManager from '@/components/tournament/KnockoutManager';
import { Trophy, Timer, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function UserKnockoutsPage() {
  const [isAnyMatchDeployed, setIsAnyMatchDeployed] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkDeployment() {
      const { count } = await supabase
        .from('match_results')
        .select('*', { count: 'exact', head: true })
        .gte('id', 73);
      
      setIsAnyMatchDeployed((count || 0) > 0);
      setLoading(false);
    }
    checkDeployment();
  }, []);

  if (loading) return null;

  if (!isAnyMatchDeployed) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Cinematic background decorations */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        
        <div className="space-y-6 max-w-2xl animate-in fade-in zoom-in duration-1000">
          <div className="relative inline-block">
             <Trophy className="w-24 h-24 text-primary drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]" />
             <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-primary/40 animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
              El Camino a la <span className="text-primary">Gloria</span>
            </h1>
            <p className="text-white/40 font-bold uppercase text-xs md:text-sm tracking-[0.4em] max-w-md mx-auto">
              La fase final se revelará cuando se defina el último clasificado en el Grupo L.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-8">
             <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                <Timer className="w-5 h-5 text-primary" />
                <span className="text-xs font-black text-white/80 uppercase tracking-widest">Calculando Cruces...</span>
             </div>
          </div>
          
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] pt-12">
            Solo los mejores llegarán a la gran final en New York.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
          La Fase <span className="text-primary">Final</span>
        </h1>
        <p className="text-white/40 font-medium uppercase text-xs tracking-[0.3em]">
          Copa del Mundo FIFA 2026 | El Camino a la Gloria
        </p>
      </div>

      <KnockoutManager isAdmin={false} />
    </div>
  );
}
