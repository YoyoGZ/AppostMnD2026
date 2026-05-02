"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, User, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { burnVipTokenAction } from '@/app/actions/tokens';

export default function TicketClient({ token }: { token: string }) {
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (alias.trim().length < 3) {
      setError("El alias debe tener al menos 3 letras.");
      setIsLoading(false); return;
    }

    const sanitizedAlias = alias.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
    const pseudoEmail = `${sanitizedAlias}@fixture2026.app`;

    try {
      // 1. Crear usuario en Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: pseudoEmail,
        password: password,
        options: { data: { display_name: alias.trim() } }
      });

      if (authError) throw authError;

      // 2. Transacción Atómica: Quemar Token y validar Fundador
      const res = await burnVipTokenAction(token);
      
      if (!res.success) {
        throw new Error(res.error || "Error al procesar el ticket. Contacta a soporte.");
      }

      // 3. Todo perfecto. El usuario es redirigido a fundar su arena
      router.push("/onboarding");
      
    } catch (err: any) {
      setError(err.message || "Error inesperado al canjear el ticket.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* TICKET VISUAL */}
      <div className={`relative transition-all duration-700 ease-out transform ${showForm ? '-translate-y-8 scale-95 opacity-50 blur-sm pointer-events-none' : 'translate-y-0'}`}>
        
        <div className="w-full max-w-sm mx-auto bg-black border-[1px] border-yellow-500/30 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(234,179,8,0.15)] relative overflow-hidden">
          
          {/* Adornos del Ticket */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-700"></div>
          <div className="absolute -left-4 top-1/2 w-8 h-8 bg-[#050505] rounded-full border border-yellow-500/30"></div>
          <div className="absolute -right-4 top-1/2 w-8 h-8 bg-[#050505] rounded-full border border-yellow-500/30"></div>
          <div className="absolute left-6 right-6 top-1/2 border-t-2 border-dashed border-white/10"></div>

          {/* Top Section */}
          <div className="text-center pb-10">
            <h3 className="text-yellow-500 font-black tracking-[0.3em] uppercase text-[10px] mb-4">Golden Pass</h3>
            <img src="/logo.svg" alt="Mundial Logo" className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">LICENCIA<br/><span className="text-white/40">DE CAPITÁN</span></h1>
          </div>

          {/* Bottom Section */}
          <div className="text-center pt-8">
            <div className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-500/20 mb-6">
              <AlertTriangle className="w-3 h-3" /> Acceso de Un Solo Uso
            </div>
            
            <p className="text-white/40 text-xs font-medium mb-8 px-4 leading-relaxed">
              Este documento certifica tu derecho a fundar una Arena Privada en el Fixture 2026.
            </p>

            <button 
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-500 text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            >
              Canjear Pase <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE CANJE (Aparece al hacer click) */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4 transition-all duration-500 delay-100 ${showForm ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
        <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white uppercase">Tu Identidad</h2>
            <ShieldCheck className="text-yellow-500 w-6 h-6" />
          </div>

          <form onSubmit={handleRedeem} className="flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-white/30" />
              </div>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Elige tu Alias"
                className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/30" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Clave Secreta Fuerte"
                className="block w-full pl-12 pr-12 py-3.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
            >
              {isLoading ? "Validando..." : "Sellar Identidad y Entrar"}
            </button>

            <button 
              type="button"
              onClick={() => setShowForm(false)}
              className="mt-2 text-white/30 hover:text-white text-[10px] font-bold uppercase tracking-widest"
            >
              Volver al Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
