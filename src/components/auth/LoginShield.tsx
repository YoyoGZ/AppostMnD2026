"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Lock, User, ArrowRight, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinLeagueAction } from "@/app/actions/leagues";

type LoginShieldProps = {
  inviteCode?: string;
  leagueInfo?: {
    name: string;
    captainAlias: string;
  } | null;
};

export const LoginShield = ({ inviteCode: propInviteCode, leagueInfo }: LoginShieldProps) => {
  const searchParams = useSearchParams();
  const urlInviteCode = searchParams.get("invite");
  const inviteCode = propInviteCode || urlInviteCode; // Fallback dinámico

  const [isNewUser, setIsNewUser] = useState(!!inviteCode);
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Detectar sesión activa para flujo de "Unión Rápida"
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });
  }, [supabase.auth]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`🔑 [LOGINSHIELD] Iniciando Auth. InviteCode: ${inviteCode || 'NONE'}`);
    setError(null);
    setIsLoading(true);

    if (alias.trim().length < 3) {
      setError("El alias debe tener al menos 3 letras.");
      setIsLoading(false);
      return;
    }

    if (isNewUser && password !== confirmPassword) {
      setError("Las claves secretas no coinciden.");
      setIsLoading(false);
      return;
    }

    // Sanitizamos el Alias eliminando acentos, espacios y caracteres especiales para que siempre sea un "Email" válido para Supabase
    const sanitizedAlias = alias.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
    const pseudoEmail = `${sanitizedAlias}@fixture2026.app`;

    try {
      if (isNewUser) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: pseudoEmail,
          password: password,
          options: {
            data: { display_name: alias.trim() } // Guarda el alias original en metadata
          }
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: pseudoEmail,
          password: password,
        });
        if (signInError) throw signInError;
      }
      
      // Victoria: Autenticado correctamente
      if (inviteCode) {
        // Redirigir a la nueva página de unión dedicada
        const targetPath = `/join/${inviteCode}`;
        console.log(`🚀 [LOGINSHIELD] Redirigiendo a página de unión: ${targetPath}`);
        router.push(targetPath);
      } else {
        // Flujo normal sin invitación
        console.log(`🚀 [LOGINSHIELD] Redirigiendo a Dashboard`);
        router.push("/dashboard");
      }
      
      router.refresh();
      
    } catch (err: unknown) {
      // Evitamos console.error para que Next.js no dispare overlays de error en dev si no es necesario,
      // pero logueamos de forma simple para depuración.
      console.log("Auth attempt failed:", err);
      
      let errorMessage = "Ocurrió un error inesperado.";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String((err as Record<string, unknown>).message);
      }

      // Mapeo de errores de Supabase
      if (errorMessage.includes("Invalid login credentials") || errorMessage.includes("Email not found")) {
        setError("Clave incorrecta o alias no encontrado.");
      } else if (errorMessage.includes("Rate limit")) {
        setError("Demasiados intentos. Espera un momento.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">
      <div className="w-full bento-card bg-card-body/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden relative rounded-2xl">
        {/* Adorno superior (Bento Grid Style) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>
        
        <div className="p-8 pb-10">
          <div className="text-center mb-8">
            {leagueInfo ? (
              <>
                <h1 className="text-2xl font-black text-white tracking-tighter drop-shadow-md uppercase">
                  Bienvenido a <span className="text-primary">{leagueInfo.name}</span>
                </h1>
                <p className="text-white/50 text-[10px] mt-2 font-bold uppercase tracking-widest">
                  Arena fundada por <span className="text-primary/80">{leagueInfo.captainAlias}</span>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">IDENTITY<span className="text-primary">SHIELD</span></h1>
                <p className="text-white/50 text-sm mt-2 font-medium">Acceso reservado a los participantes de la liga</p>
              </>
            )}
          </div>
          
          {currentUser && inviteCode ? (
            <div className="flex flex-col gap-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-white/70 text-xs font-medium leading-relaxed">
                  Ya tienes una sesión activa como <strong className="text-primary">{currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0]}</strong>. 
                  ¿Quieres unirte a esta Arena ahora mismo?
                </p>
              </div>
              <button
                onClick={() => {
                  router.push(`/join/${inviteCode}`);
                }}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                ¡SÍ, UNIRME AHORA! <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                className="text-[10px] text-white/30 hover:text-white uppercase font-bold tracking-widest transition-colors"
              >
                No soy yo, cerrar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-white/30" />
              </div>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Tu Alias / Apodo"
                className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-black/40 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
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
                placeholder="Clave Secreta"
                className="block w-full pl-12 pr-12 py-3.5 border border-white/10 rounded-xl bg-black/40 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                required
              />
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white transition-colors z-20"
                style={{ cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isNewUser ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary/40" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la Clave"
                  className="block w-full pl-12 pr-12 py-3.5 border border-white/10 rounded-xl bg-primary/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                  required={isNewUser}
                />
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white transition-colors z-20"
                  style={{ cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-red-400 mt-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase leading-tight">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
            >
              {isLoading ? "VERIFICANDO ENLACE..." : (
                inviteCode ? "UNIRME A LA ARENA" : "INGRESAR AL FIXTURE MUNDIAL 2026"
              )}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
          )}
        </div>
        
        {/* Footer Toggle (Glassmorphism dark zone) */}
        {!currentUser && (
          <div className="bg-black/60 px-8 py-5 flex justify-between items-center text-xs font-medium">
            <span className="text-white/40">{isNewUser ? "¿Ya eras de la banda?" : "¿Primera vez aquí?"}</span>
            <button 
              type="button"
              onClick={() => {
                setIsNewUser(!isNewUser);
                setError(null);
              }}
              className="text-primary hover:text-white transition-colors uppercase font-black tracking-widest text-[10px]"
            >
              {isNewUser ? "INGRESAR" : "REGISTRARME"}
            </button>
          </div>
        )}
      </div>
      
      {/* Advertencia Fuera de la Tarjeta */}
      <div className={`transition-all duration-500 ${isNewUser && !currentUser ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className="mt-8 text-center max-w-[280px]">
          <p className="text-red-500/80 text-[10px] uppercase font-black tracking-[0.2em] mb-2 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" /> Llave Única
          </p>
          <p className="text-white/40 text-[11px] leading-relaxed font-medium">
            Esta clave es tu identidad. Si la olvidas, es matemáticamente imposible recuperar tus puntos del campeonato.
          </p>
        </div>
      </div>
    </div>
  );
};

