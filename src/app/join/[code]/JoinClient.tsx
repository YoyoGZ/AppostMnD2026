"use client";

import React, { useState } from "react";
import { 
  ArrowRight, 
  Loader2, 
  Lock, 
  User, 
  Mail, 
  Users, 
  X, 
  Trophy, 
  MessageSquare, 
  Zap, 
  Sparkles, 
  Crown,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

type LeagueInfo = {
  id: string;
  name: string;
  captainAlias: string;
};

type Props = {
  code: string;
  leagueInfo: LeagueInfo;
  isAuthenticated: boolean;
  userAlias?: string;
};

export function JoinClient({ code, leagueInfo, isAuthenticated, userAlias }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Estado A: Usuario ya logueado --- //
  const handleJoinDirect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Iniciá sesión para continuar.");
        setIsLoading(false);
        return;
      }

      // Validar si ya es miembro (para no cobrarle doble si refresca la pantalla)
      const { data: member } = await supabase
        .from('league_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('league_id', leagueInfo.id)
        .maybeSingle();

      if (member) {
        router.push("/dashboard");
      } else {
        router.push(`/paywall?join=${code}`);
      }
    } catch (err) {
      console.error("Error al validar membresía activa:", err);
      router.push(`/paywall?join=${code}`);
    }
  };

  const handleDecline = () => {
    router.push("/");
  };

  // --- Estado B: Usuario sin sesión — registrarse y redirigir al pago --- //
  const handleRegisterAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("El correo electrónico no es válido.");
      return;
    }
    if (alias.trim().length < 2) {
      setError("El alias debe tener al menos 2 letras.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las claves secretas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { display_name: alias.trim() } },
      });
      if (signUpError) throw signUpError;

      // Redirigir de inmediato al Paywall de Invitado
      router.push(`/paywall?join=${code}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      if (msg.includes("already registered") || msg.toLowerCase().includes("already registered")) {
        setError("Este correo electrónico ya está registrado. ¿Querés iniciar sesión?");
      } else if (msg.includes("Rate limit")) {
        setError("Demasiados intentos. Espera un momento.");
      } else {
        setError(msg);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl items-start">
      
      {/* ======================================================
          COLUMNA DETALLES & PROPUESTA DE VALOR (Bento Cards)
          ====================================================== */}
      <div className="md:col-span-7 flex flex-col gap-6 w-full">
        
        {/* Bento 1: Tarjeta Premium de Bienvenida a la Liga */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-2xl group hover:border-primary/20 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/30 via-primary to-primary/30 opacity-60" />
          
          {/* Adorno de Fondo (Copa Difuminada) */}
          <div className="absolute right-[-40px] bottom-[-45px] w-64 h-64 opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-500 transform rotate-12">
            <Image
              src="/assets/Copa_1.png"
              alt="Copa Mundial"
              fill
              className="object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(251,191,36,0.05)]">
                <Crown className="w-3 h-3 text-primary" /> Invitación Oficial
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                <Users className="w-3 h-3" /> Miembros Ilimitados
              </span>
            </div>

            <p className="text-white/40 text-[10px] uppercase tracking-widest font-black mb-1">
              Nombre de la Arena
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter leading-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)]">
              {leagueInfo.name}
            </h2>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm uppercase shadow-inner">
              {leagueInfo.captainAlias.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                Capitán Fundador
              </p>
              <p className="text-xs text-slate-200 font-bold">
                Fue creada por <span className="text-primary font-black underline">{leagueInfo.captainAlias}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bento 2: Características de Juego Exclusivas */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <h3 className="text-white/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> ¿Qué te espera en MundiApp26?
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Feature 1: Oráculo */}
            <div className="p-4 rounded-xl bg-black/35 border border-white/5 hover:border-white/10 transition-colors flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Pronósticos en Vivo</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Cargá tus predicciones de fase de grupos y eliminatorias. Sumá puntos por goles, resultados y tendencias.
                </p>
              </div>
            </div>

            {/* Feature 2: Chicanas */}
            <div className="p-4 rounded-xl bg-black/35 border border-white/5 hover:border-white/10 transition-colors flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Gastadas & Chat Privado</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Un canal exclusivo de chat en tiempo real para chicanear, debatir y festejar los goles con toda tu liga.
                </p>
              </div>
            </div>

            {/* Feature 3: Posiciones */}
            <div className="p-4 rounded-xl bg-black/35 border border-white/5 hover:border-white/10 transition-colors flex items-start gap-3 sm:col-span-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Tabla de Posiciones al Instante</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Seguí el ranking interactivo de los miembros de tu liga en tiempo real. ¡El Oráculo computa todo al sonar el pitido final!
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bento 3: Sorteo de la Camiseta Oficial */}
        <div className="bg-gradient-to-r from-sky-600/15 via-white/5 to-sky-600/15 border border-sky-500/20 p-6 sm:p-7 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6 shadow-2xl group hover:border-sky-400/30 transition-all duration-300">
          
          <div className="flex-1 text-center sm:text-left">
            <span className="bg-sky-500/20 text-sky-400 border border-sky-400/30 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest w-max mx-auto sm:mx-0 flex items-center gap-1.5 mb-3">
              🎯 Sorteo de la Camiseta
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
              ¡Ganá la Camiseta de la Selección Argentina! 🇦🇷
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-2 leading-relaxed max-w-sm">
              Cada jugador invitado que active su pase individual de <strong className="text-primary font-black">$5.000 ARS</strong> ingresará automáticamente en el sorteo oficial de la camiseta albiceleste de la Copa del Mundo 2026.
            </p>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 relative shrink-0 drop-shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <Image
              src="/assets/camiseta.png"
              alt="Camiseta Argentina Oficial Mundial 2026"
              fill
              className="object-contain"
            />
          </div>

        </div>

      </div>

      {/* ======================================================
          COLUMNA ACCIÓN (Formulario de Registro o Botón Directo)
          ====================================================== */}
      <div className="md:col-span-5 w-full">
        
        {/* RENDER — Estado A: Usuario ya logueado */}
        {isAuthenticated ? (
          <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

            <div className="p-6 sm:p-8 flex flex-col gap-6">
              
              <div className="text-center">
                <p className="text-slate-200 text-[10px] uppercase tracking-widest font-black mb-2 flex items-center justify-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> Sesión Activa Detectada
                </p>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">
                  ¿Listo para la Batalla?
                </h3>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-slate-100 text-xs leading-relaxed font-semibold">
                  Hola, <strong className="text-primary font-black">"{userAlias}"</strong>. Fuiste invitado a sumarte a esta liga. ¿Aceptás el desafío mundialista?
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[11px] font-bold uppercase text-center">
                  {error}
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleJoinDirect}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      ¡Acepto el Reto! <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleDecline}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 text-white/30 hover:text-white/60 text-[10px] font-bold uppercase tracking-widest transition-colors py-2"
                >
                  <X className="w-3.5 h-3.5" /> Volver a Inicio
                </button>
              </div>
            </div>
          </div>
        ) : (
          
          /* RENDER — Estado B: Usuario sin sesión (Registro rápido + join) */
          <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

            <div className="p-6 sm:p-8 flex flex-col gap-5">
              
              <div className="text-center">
                <p className="text-slate-300 text-[10px] uppercase tracking-widest font-black mb-1.5 flex items-center justify-center gap-1">
                  ⚔️ Unirme al Coliseo
                </p>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">
                  Creá tu Cuenta
                </h3>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5 text-center">
                <p className="text-slate-200 text-[11px] leading-relaxed font-bold">
                  Registrate para ingresar. Luego te dirigiremos a Mercado Pago para abonar tu membresía individual de <strong className="text-primary font-black">$5.000 ARS</strong>.
                </p>
              </div>

              {/* Formulario registro + join */}
              <form onSubmit={handleRegisterAndJoin} className="flex flex-col gap-4">
                
                {/* Input Email */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu correo electrónico"
                    className="block w-full pl-11 pr-4 py-3 border border-white/10 rounded-xl bg-black/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-xs font-semibold"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Input Alias */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Tu Alias en la Liga"
                    className="block w-full pl-11 pr-4 py-3 border border-white/10 rounded-xl bg-black/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-xs font-semibold"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Input Clave */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Clave Secreta"
                    className="block w-full pl-11 pr-4 py-3 border border-white/10 rounded-xl bg-black/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-xs font-semibold"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Input Confirmar Clave */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-primary/50" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí tu Clave"
                    className="block w-full pl-11 pr-4 py-3 border border-white/10 rounded-xl bg-primary/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-xs font-semibold"
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[11px] font-bold uppercase text-center leading-normal">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 mt-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      REGISTRARME Y PAGAR <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Ya tengo cuenta */}
            <div className="bg-black/60 px-6 sm:px-8 py-4 flex justify-between items-center text-[11px] font-semibold border-t border-white/10">
              <span className="text-slate-300">¿Ya eras de la banda?</span>
              <a
                href={`/?redirect=/join/${code}`}
                className="text-primary hover:text-white transition-colors uppercase font-black tracking-widest text-[10px] underline flex items-center gap-0.5"
              >
                Iniciar Sesión <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        )}

      </div>
      
    </div>
  );
}

