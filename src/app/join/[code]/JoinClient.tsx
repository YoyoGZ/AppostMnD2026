"use client";

import React, { useState } from "react";
import { Shield, ArrowRight, Loader2, Lock, User, Users, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { joinLeagueAction } from "@/app/actions/leagues";
import { useRouter } from "next/navigation";

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

  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Estado A: Usuario ya logueado --- //
  const handleJoinDirect = async () => {
    setIsLoading(true);
    setError(null);
    const res = await joinLeagueAction(code);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    }
    // joinLeagueAction hace redirect() internamente al tener éxito
  };

  const handleDecline = () => {
    router.push("/dashboard");
  };

  // --- Estado B: Usuario sin sesión — registrarse y unirse en un paso --- //
  const handleRegisterAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (alias.trim().length < 3) {
      setError("El alias debe tener al menos 3 letras.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las claves secretas no coinciden.");
      return;
    }

    setIsLoading(true);

    // Sanitizar alias → pseudo-email
    const sanitized = alias
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    const pseudoEmail = `${sanitized}@fixture2026.app`;

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: pseudoEmail,
        password,
        options: { data: { display_name: alias.trim() } },
      });
      if (signUpError) throw signUpError;

      // Unirse a la liga inmediatamente después del registro
      const res = await joinLeagueAction(code);
      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }
      // joinLeagueAction redirige al dashboard si tiene éxito
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      if (msg.includes("already registered")) {
        setError("Este alias ya está en uso. Elige uno diferente.");
      } else if (msg.includes("Rate limit")) {
        setError("Demasiados intentos. Espera un momento.");
      } else {
        setError(msg);
      }
      setIsLoading(false);
    }
  };

  // ======================================================
  // RENDER — Estado A: Usuario logueado
  // ======================================================
  if (isAuthenticated) {
    return (
      <div className="w-full bento-card bg-card-body/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

        <div className="p-8 flex flex-col gap-6">
          {/* Liga info */}
          <div className="text-center">
            <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2 flex items-center justify-center gap-2">
              <Users className="w-3.5 h-3.5 text-primary" />
              Arena Privada
            </p>
            <h2 className="text-2xl font-black text-white tracking-tighter">
              {leagueInfo.name}
            </h2>
            <p className="text-white/40 text-xs mt-2">
              Fundada por{" "}
              <span className="text-primary font-bold">
                {leagueInfo.captainAlias}
              </span>
            </p>
          </div>

          {/* Mensaje al usuario logueado */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-white/70 text-xs leading-relaxed">
              Hola,{" "}
              <strong className="text-primary">{userAlias}</strong>. Fuiste
              invitado a unirte a esta Arena. ¿Aceptas el desafío?
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
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
              <X className="w-3.5 h-3.5" /> Rechazar invitación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================
  // RENDER — Estado B: Usuario sin sesión (registro + join)
  // ======================================================
  return (
    <div className="w-full bento-card bg-card-body/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

      <div className="p-8 flex flex-col gap-6">
        {/* Liga info */}
        <div className="text-center">
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2 flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Tu Arena
          </p>
          <h2 className="text-2xl font-black text-white tracking-tighter">
            {leagueInfo.name}
          </h2>
          <p className="text-white/40 text-xs mt-2">
            Fundada por{" "}
            <span className="text-primary font-bold">
              {leagueInfo.captainAlias}
            </span>
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-white/60 text-xs leading-relaxed">
            Crea tu identidad de gladiador para unirte. Esta clave es tu única
            llave al campeonato — no se puede recuperar.
          </p>
        </div>

        {/* Formulario registro + join */}
        <form onSubmit={handleRegisterAndJoin} className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-white/30" />
            </div>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Tu Alias / Apodo en la Arena"
              className="block w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-xl bg-black/40 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-sm"
              required
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-white/30" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Clave Secreta"
              className="block w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-xl bg-black/40 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-sm"
              required
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-primary/40" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la Clave"
              className="block w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-xl bg-primary/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-sm"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[11px] font-bold uppercase text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Crear Cuenta y Entrar a la Arena{" "}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Ya tengo cuenta */}
      <div className="bg-black/60 px-8 py-4 flex justify-between items-center text-xs font-medium border-t border-white/5">
        <span className="text-white/40">¿Ya eras de la banda?</span>
        <a
          href={`/?redirect=/join/${code}`}
          className="text-primary hover:text-white transition-colors uppercase font-black tracking-widest text-[10px]"
        >
          Iniciar Sesión
        </a>
      </div>
    </div>
  );
}
