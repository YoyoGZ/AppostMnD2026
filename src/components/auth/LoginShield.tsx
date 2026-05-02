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
      let authUser = null;
      if (isNewUser) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: pseudoEmail,
          password: password,
          options: {
            data: { display_name: alias.trim() } // Guarda el alias original en metadata
          }
        });
        if (signUpError) throw signUpError;
        authUser = data.user;
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: pseudoEmail,
          password: password,
        });
        if (signInError) throw signInError;
        authUser = data.user;
      }
      
      // Victoria: Autenticado correctamente
      const role = authUser?.user_metadata?.role;

      if (inviteCode) {
        // Redirigir a la nueva página de unión dedicada
        const targetPath = `/join/${inviteCode}`;
        console.log(`🚀 [LOGINSHIELD] Redirigiendo a página de unión: ${targetPath}`);
        router.push(targetPath);
      } else if (role === 'super_admin') {
        // Si es el Fundador Supremo, va directo al HQ
        console.log(`🚀 [LOGINSHIELD] Redirigiendo al Cuartel General (God Mode)`);
        router.push("/hq");
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
      <div className={`w-full bento-card ${isNewUser ? 'bg-primary/5 border-primary/40 shadow-[0_0_30px_rgba(251,191,36,0.15)]' : 'bg-white/5 border-white/10'} backdrop-blur-xl shadow-2xl overflow-hidden relative rounded-2xl transition-all duration-500`}>
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
          
          {/* Tabs de Selección de Modo */}
          {!currentUser && (
            <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setIsNewUser(false);
                  setError(null);
                }}
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${
                  !isNewUser
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNewUser(true);
                  setError(null);
                }}
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${
                  isNewUser
                    ? "bg-transparent text-primary border-[2px] border-primary shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                    : "text-white/40 hover:text-white hover:bg-white/5 border-[2px] border-transparent"
                }`}
              >
                Nueva Cuenta
              </button>
            </div>
          )}
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
                className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-black/40 text-white placeholder-white/50 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                required
              />
            </div>

            {isNewUser && (
              <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-3 mb-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-red-500 text-[12px] font-black uppercase flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4" /> ¡Atención: Clave Irrecuperable!
                </p>
                <p className="text-red-400/90 text-[11px] leading-tight font-medium">
                  Esta clave no se puede resetear. Si la olvidas, es matemáticamente imposible recuperar tus puntos y tu cuenta.
                </p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/30" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Clave Secreta"
                className="block w-full pl-12 pr-12 py-3.5 border border-white/10 rounded-xl bg-black/40 text-white placeholder-white/50 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
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
                  className="block w-full pl-12 pr-12 py-3.5 border border-white/10 rounded-xl bg-primary/5 text-white placeholder-white/50 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
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
        

      </div>

    </div>
  );
};

