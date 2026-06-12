"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Lock, Mail, User, ArrowRight, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinLeagueAction } from "@/app/actions/leagues";
import { checkAliasAvailabilityAction } from "@/app/actions/admin";

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
  const mode = searchParams.get("mode");
  const inviteCode = propInviteCode || urlInviteCode;

  const [isNewUser, setIsNewUser] = useState(!!inviteCode || mode === 'register');
  const [leagueName, setLeagueName] = useState("");
  const [email, setEmail] = useState("");
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
    supabase.auth.getUser().then(({ data }: any) => {
      const user = data?.user;
      if (user) setCurrentUser(user);
    });
  }, [supabase.auth]);


  // Validación de email: debe tener @ y un dominio con .
  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`🔑 [LOGINSHIELD] Iniciando Auth. InviteCode: ${inviteCode || 'NONE'}`);
    setError(null);
    setIsLoading(true);

    // Validación de Liga (solo si es nuevo y no es invitado)
    if (isNewUser && !inviteCode && leagueName.trim().length < 3) {
      setError("El nombre de la liga debe tener al menos 3 caracteres.");
      setIsLoading(false);
      return;
    }

    // Validación de email
    if (!isValidEmail(email.trim())) {
      setError("El correo electrónico no es válido. Debe incluir @ y un dominio (ej: nombre@mail.com).");
      setIsLoading(false);
      return;
    }

    // Validación de alias en registro
    if (isNewUser && alias.trim().length < 2) {
      setError("El apodo debe tener al menos 2 caracteres.");
      setIsLoading(false);
      return;
    }

    // Validación de clave mínima
    if (password.length < 8) {
      setError("La clave debe tener al menos 8 caracteres.");
      setIsLoading(false);
      return;
    }

    if (isNewUser && password !== confirmPassword) {
      setError("Las claves secretas no coinciden.");
      setIsLoading(false);
      return;
    }

    // Validar disponibilidad de alias para evitar duplicados en leaderboards y chat
    if (isNewUser) {
      try {
        const checkAlias = await checkAliasAvailabilityAction(alias);
        if (checkAlias.success && !checkAlias.available) {
          setError(`El apodo "${alias.trim()}" ya está registrado por otro jugador. Elegí otro para diferenciarte.`);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error al validar disponibilidad del apodo:", e);
      }
    }

    try {
      let authUser = null;
      if (isNewUser) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              display_name: alias.trim() || email.split('@')[0], // Alias o parte del email como fallback
            }
          }
        });
        if (signUpError) throw signUpError;

        // Supabase security: if user exists, it might return a user but with empty identities
        if (data?.user?.identities && data.user.identities.length === 0) {
          throw new Error("User_Already_Exists");
        }

        authUser = data.user;
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password,
        });
        if (signInError) throw signInError;
        authUser = data.user;
      }

      // Victoria: Autenticado correctamente
      const role = authUser?.user_metadata?.role;

      if (inviteCode) {
        const targetPath = `/join/${inviteCode}`;
        console.log(`🚀 [LOGINSHIELD] Redirigiendo a página de unión: ${targetPath}`);
        router.push(targetPath);
      } else if (isNewUser && leagueName) {
        console.log(`🚀 [LOGINSHIELD] Redirigiendo al Paywall para activar la liga: ${leagueName}`);
        router.push(`/paywall?leagueName=${encodeURIComponent(leagueName.trim())}`);
      } else if (role === 'super_admin') {
        console.log(`🚀 [LOGINSHIELD] Redirigiendo al Cuartel General (God Mode)`);
        router.push("/hq");
      } else {
        console.log(`🚀 [LOGINSHIELD] Redirigiendo a Dashboard`);
        router.push("/dashboard");
      }

      router.refresh();

    } catch (err: unknown) {
      console.log("Auth attempt failed:", err);

      let errorMessage = "Ocurrió un error inesperado.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String((err as Record<string, unknown>).message);
      }

      // Mapeo de errores de Supabase
      if (errorMessage.includes("Invalid login credentials") || errorMessage.includes("Email not found")) {
        setError("Correo o clave incorrectos. Verificá tus datos.");
      } else if (errorMessage.includes("Rate limit")) {
        setError("Demasiados intentos. Espera un momento.");
      } else if (errorMessage.includes("User_Already_Exists") || errorMessage.toLowerCase().includes("already registered")) {
        setError(`El correo "${email.trim()}" ya está registrado. ¿Querés ingresar?`);
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
        {/* Adorno superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>

        <div className="p-8 pb-10">
          <div className="text-center mb-8">
            {leagueInfo ? (
              <>
                <h1 className="text-2xl font-black text-white tracking-tighter drop-shadow-md uppercase">
                  Bienvenido a <span className="text-primary">{leagueInfo.name}</span>
                </h1>
                <p className="text-white/50 text-[10px] mt-2 font-bold uppercase tracking-widest">
                  Liga fundada por <span className="text-primary font-black underline">{leagueInfo.captainAlias}</span>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">IDENTITY<span className="text-primary">SHIELD</span></h1>
                <p className="text-slate-200 text-sm mt-2 font-semibold">Acceso reservado a los participantes de la liga</p>
              </>
            )}
          </div>



          {currentUser && inviteCode ? (
            <div className="flex flex-col gap-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-white/70 text-xs font-medium leading-relaxed">
                  Ya tenés una sesión activa como <strong className="text-primary">{currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0]}</strong>.
                  ¿Querés unirte a esta Liga ahora mismo?
                </p>
              </div>
              <button
                onClick={() => { router.push(`/join/${inviteCode}`); }}
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

              {/* ── Campo: Nombre de Liga (Solo para Fundadores Nuevos) ── */}
              <div className={`transition-all duration-300 overflow-hidden ${isNewUser && !inviteCode ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                  </div>
                  <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="Bautizá tu Liga (Ej: Los Pibes)"
                    className="block w-full pl-10 sm:pl-12 pr-3.5 py-2.5 sm:py-3.5 border-2 border-primary/60 rounded-xl bg-primary/10 text-white placeholder-slate-300 font-black focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs sm:text-sm transition-all"
                    required={isNewUser && !inviteCode}
                  />
                </div>
              </div>

              {/* ── Campo: Email ── */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/30" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  className="block w-full pl-10 sm:pl-12 pr-3.5 py-2.5 sm:py-3.5 border border-white/20 rounded-xl bg-black/60 text-white placeholder-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-xs sm:text-sm transition-all"
                  required
                />
              </div>

              {/* ── Campo: Alias (solo en registro) ── */}
              <div className={`transition-all duration-300 overflow-hidden ${isNewUser ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-white/30" />
                  </div>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Tu apodo en la app (ej: El Pibe)"
                    autoComplete="username"
                    className="block w-full pl-10 sm:pl-12 pr-3.5 py-2.5 sm:py-3.5 border border-white/20 rounded-xl bg-black/60 text-white placeholder-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-xs sm:text-sm transition-all"
                    required={isNewUser}
                  />
                </div>
              </div>

              {/* ── Advertencia clave irrecuperable (solo registro) ── */}
              {isNewUser && (
                <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-red-500 text-[12px] font-black uppercase flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4" /> ¡Atención: Clave Irrecuperable!
                  </p>
                  <p className="text-red-400/90 text-[11px] leading-tight font-medium">
                    Esta clave no se puede resetear. Si la olvidás, es imposible recuperar tu cuenta y tus puntos.
                  </p>
                </div>
              )}

              {/* ── Sugerencia de clave (solo registro) ── */}
              {isNewUser && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 animate-in fade-in duration-300">
                  <p className="text-primary text-[11px] font-black uppercase tracking-widest mb-1">💡 Sugerencia para no olvidarla</p>
                  <p className="text-slate-200 text-[11px] leading-snug font-semibold">
                    Usá <strong className="text-white">2 letras + los 6 últimos dígitos de tu DNI</strong>.<br/>
                    Ejemplo: <span className="text-primary font-mono font-black">AB123456</span>
                  </p>
                </div>
              )}

              {/* ── Campo: Clave ── */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/30" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Clave Secreta (mín. 8 caracteres)"
                  autoComplete={isNewUser ? "new-password" : "current-password"}
                  className="block w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3.5 border border-white/20 rounded-xl bg-black/60 text-white placeholder-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-xs sm:text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPassword(!showPassword); }}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/30 hover:text-white transition-colors z-20"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* ── Campo: Confirmar Clave (solo registro) ── */}
              <div className={`transition-all duration-300 overflow-hidden ${isNewUser ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-primary/40" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí la Clave"
                    autoComplete="new-password"
                    className="block w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3.5 border border-white/20 rounded-xl bg-primary/10 text-white placeholder-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-xs sm:text-sm transition-all"
                    required={isNewUser}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirmPassword(!showConfirmPassword); }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/30 hover:text-white transition-colors z-20"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-red-400 mt-2">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] font-bold uppercase leading-tight">{error}</span>
                </div>
              )}

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                {isLoading ? "VERIFICANDO..." : (
                  inviteCode ? "UNIRME A LA LIGA" : (isNewUser ? "CREAR CUENTA" : "INGRESAR")
                )}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>

              {/* ── Toggle Login / Registro ── */}
              {!inviteCode && (
                <div className="mt-4 text-center">
                  {isNewUser ? (
                    <button type="button" onClick={() => { setIsNewUser(false); setError(null); }} className="text-slate-200 hover:text-white text-[12px] uppercase font-bold tracking-widest transition-colors">
                      ¿Ya tenés cuenta? <span className="text-primary font-black underline ml-1">Ingresá acá</span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setIsNewUser(true); setError(null); }} className="text-slate-200 hover:text-white text-[12px] uppercase font-bold tracking-widest transition-colors">
                      ¿No tenés cuenta? <span className="text-primary font-black underline ml-1">Armá tu Liga acá</span>
                    </button>
                  )}
                </div>
              )}
              
              {/* Botón de escape: Cerrar sesión si ya estabas logueado */}
              {currentUser && !inviteCode && (
                <div className="mt-2 text-center border-t border-white/5 pt-4">
                  <p className="text-white/40 text-[10px] mb-2 font-medium">Estás logueado como {currentUser.email}</p>
                  <button 
                    type="button" 
                    onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} 
                    className="text-red-400/60 hover:text-red-400 text-[11px] uppercase font-bold tracking-widest transition-colors"
                  >
                    Cerrar sesión actual
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
