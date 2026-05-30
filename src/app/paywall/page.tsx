"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Shield, CreditCard, CheckCircle2, ChevronRight, Zap, Loader2, Trophy, ArrowRight, Star } from "lucide-react";
import { createPaymentPreferenceAction, checkAndPromoteCorporateUserAction } from "@/app/actions/payments";
import { createLeagueAction, getLeagueByInvite } from "@/app/actions/leagues";
import { validatePromoCodeAction, savePromoCodeToProfileAction } from "@/app/actions/promo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function PaywallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLeagueName = searchParams.get('leagueName');
  const joinLeagueCode = searchParams.get('join');

  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Slots de creación de Ligas
  const [maxLeagues, setMaxLeagues] = useState(0);
  const [foundedCount, setFoundedCount] = useState(0);
  
  // Nombre de liga a crear. Puede venir de URL o ingresarse manualmente
  const [leagueName, setLeagueName] = useState(urlLeagueName || "");
  const [creatingLeague, setCreatingLeague] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados reactivos para la validación de códigos de promoción
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoOwner, setPromoOwner] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Estados de invitado
  const [invitedLeagueInfo, setInvitedLeagueInfo] = useState<{ name: string; captainAlias: string } | null>(null);
  const [loadingLeague, setLoadingLeague] = useState(false);

  // 1. Cargar información de la liga a la que fue invitado si hay un código join
  useEffect(() => {
    if (joinLeagueCode) {
      setLoadingLeague(true);
      getLeagueByInvite(joinLeagueCode).then((res: any) => {
        if (res && !res.error) {
          setInvitedLeagueInfo(res);
        }
        setLoadingLeague(false);
      });
    }
  }, [joinLeagueCode]);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          setUser(supabaseUser);
          
          // 1. Ejecutar bypass de marca blanca en el servidor para auto-ascender si aplica
          const corpRes = await checkAndPromoteCorporateUserAction();
          
          // 2. Consultar la fuente de verdad en la base de datos (tabla profiles)
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, max_leagues')
            .eq('id', supabaseUser.id)
            .single();

          // 3. Contar ligas creadas por el usuario en caliente
          const { count } = await supabase
            .from('leagues')
            .select('id', { count: 'exact', head: true })
            .eq('created_by', supabaseUser.id);
            
          if (profile) {
            setUserRole(profile.role);
            setMaxLeagues(profile.max_leagues || 0);
          } else {
            setUserRole('player');
            setMaxLeagues(0);
          }
          setFoundedCount(count || 0);
        } else {
          // Si por alguna razón no está autenticado, mandarlo al login
          router.push('/login');
        }
      } catch (err) {
        console.error("Error al verificar rol de usuario:", err);
        setErrorMessage("No pudimos validar tu sesión. Intentá recargando la página.");
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [router]);

  // Validación debounced en caliente del Código Promocional
  useEffect(() => {
    if (!promoCode.trim()) {
      setPromoValid(null);
      setPromoOwner(null);
      setPromoError(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setValidatingPromo(true);
      setPromoError(null);
      try {
        const res = await validatePromoCodeAction(promoCode.trim());
        if (res.success && res.valid) {
          setPromoValid(true);
          setPromoOwner(res.ownerName || null);
          // Persistencia síncrona inmediata en el perfil del usuario
          await savePromoCodeToProfileAction(promoCode.trim());
        } else {
          setPromoValid(false);
          setPromoError(res.error || "El código ingresado no es válido.");
        }
      } catch (err) {
        console.error("Error al validar código promocional:", err);
        setPromoValid(false);
      } finally {
        setValidatingPromo(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [promoCode]);


  // Manejar el checkout de Mercado Pago para los que deben comprar
  const handleMercadoPagoPayment = async () => {
    setErrorMessage(null);
    setLoading(true);
    
    if (!joinLeagueCode && !leagueName.trim()) {
      setErrorMessage("Por favor, ingresá el nombre que querés ponerle a tu Liga.");
      setLoading(false);
      return;
    }

    if (!joinLeagueCode && leagueName.trim().length < 3) {
      setErrorMessage("El nombre de la liga debe tener al menos 3 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const res = await createPaymentPreferenceAction(
        joinLeagueCode ? "" : leagueName.trim(),
        joinLeagueCode || undefined
      );
      
      if (res?.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else if (res?.initPoint) {
        // Redirigir al Checkout Oficial de Mercado Pago
        window.location.href = res.initPoint;
      }
    } catch (error: any) {
      console.error("Error de conexión:", error);
      setErrorMessage("Error conectando con Mercado Pago. Intentá nuevamente.");
      setLoading(false);
    }
  };

  // Manejar creación directa de liga para los que ya son Founders/SuperAdmins
  const handleDirectCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCreatingLeague(true);

    if (!leagueName.trim()) {
      setErrorMessage("Por favor, ingresá un nombre para tu Liga.");
      setCreatingLeague(false);
      return;
    }

    if (leagueName.trim().length < 3) {
      setErrorMessage("El nombre de la liga debe tener al menos 3 caracteres.");
      setCreatingLeague(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("name", leagueName.trim());
      
      const res = await createLeagueAction(fd);

      if (res && res.error) {
        setErrorMessage(res.error);
        setCreatingLeague(false);
      }
      // Si tiene éxito, createLeagueAction hace redirect("/dashboard") automáticamente
    } catch (err: any) {
      // Capturar redirect interno de Next.js como éxito
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        throw err;
      }
      console.error("Error al crear liga:", err);
      setErrorMessage("Hubo un problema al crear tu Liga. Intentá nuevamente.");
      setCreatingLeague(false);
    }
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl animate-pulse">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-white/60 text-xs uppercase font-black tracking-widest">Validando credenciales de acceso...</p>
        </div>
      </div>
    );
  }

  const isFounderActive = userRole === 'super_admin' || (maxLeagues > foundedCount);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Fondo radial dinámico */}
      <div className="fixed inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12)_0%,transparent_70%)] pointer-events-none" />
      
      <div className={(isFounderActive || joinLeagueCode) ? "w-full max-w-md mx-auto p-4 z-10" : "w-full max-w-5xl p-4 md:p-8 flex flex-col md:flex-row gap-8 items-center z-10"}>
        
        {/* Left Side: Value Prop (Solo se muestra para usuarios comunes sin pase activo) */}
        {!(isFounderActive || joinLeagueCode) && (
          <div className="flex-1 space-y-6 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3 fill-current" /> Onboarding Premium
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1]">
              {leagueName ? (
                <>ACTIVÁ TU LIGA <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white uppercase">"{leagueName}"</span></>
              ) : (
                <>CONSEGUÍ TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">FOUNDER PASS</span></>
              )}
            </h1>
            
            <p className="text-slate-200 text-sm md:text-base font-semibold leading-relaxed max-w-md">
              {leagueName 
                ? `¡Excelente elección! La liga "${leagueName}" ya está lista en el sistema. Activá tu franquicia para abrirle la puerta a tus amigos.`
                : "Para armar una Liga Privada y convertirte en el Capitán, necesitás activar tu entrada a la App. Un único pago te da acceso para vos."
              }
            </p>
            
            <ul className="space-y-4 mt-8">
              {[
                "Creación de 1 Liga Privada.",
                "Tus amigos entran comprando su pase individual de $5.000 ARS.",
                "Panel de Control de Liga, Duelos y estadísticas.",
                "Acceso al Sorteo de la Camiseta Oficial de Argentina (exige al menos 2 invitados activos)."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-slate-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Right Side: Pricing or Arena Creation Card */}
        <div className={(isFounderActive || joinLeagueCode) ? "w-full bg-white/[0.03] border border-white/10 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-white/20 animate-in zoom-in-95 duration-500" : "w-full md:w-[440px] bg-white/[0.03] border border-white/10 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-white/20"}>
          
          <div className="absolute top-0 right-0 p-4 pointer-events-none">
            {isFounderActive ? (
              <Trophy className="w-24 h-24 text-primary/10 -rotate-12" />
            ) : (
              <Shield className="w-24 h-24 text-primary/10 -rotate-12" />
            )}
          </div>

          {isFounderActive ? (
            /* ──────── CREADOR DE ARENA PARA FOUNDERS DIRECTOS ──────── */
            <form onSubmit={handleDirectCreateLeague} className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Star className="w-4 h-4 fill-primary" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white">ARENA DISPONIBLE</h3>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                <p className="text-slate-100 text-xs font-semibold leading-relaxed">
                  Ya validamos que tenés acceso de <strong className="text-primary uppercase font-black">Fundador</strong>. Bautizá tu Liga ahora mismo sin necesidad de abonar de nuevo.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-200 font-black uppercase tracking-wider block">
                  Nombre de tu Liga
                </label>
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  placeholder="Ej: Los Pibes FC, La Scaloneta"
                  className="w-full px-4 py-3.5 border border-white/20 rounded-xl bg-black/60 text-white placeholder-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  disabled={creatingLeague}
                />
              </div>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-red-400 text-[11px] font-bold uppercase leading-tight">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={creatingLeague || !leagueName.trim()}
                className="w-full py-4 px-6 bg-primary hover:bg-primary/95 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {creatingLeague ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    CREANDO ARENA...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    CREAR MI LIGA
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ──────── CHECKOUT DE MERCADO PAGO ──────── */
            joinLeagueCode ? (
              /* ──────── PAYWALL DE INVITADO EXCLUSIVO ──────── */
              <div className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <Star className="w-4 h-4 fill-primary" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">ACTIVÁ TU PASE DE LIGA</h3>
                </div>

                {loadingLeague ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : invitedLeagueInfo ? (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-1">
                    <p className="text-slate-100 text-xs font-semibold leading-relaxed">
                      Vas a unirte a la Liga Privada de tu amigo: <strong className="text-primary font-black underline">{invitedLeagueInfo.captainAlias}</strong>
                    </p>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider">
                      LIGA: <span className="text-white font-black">{invitedLeagueInfo.name}</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                    <p className="text-red-400 text-xs font-semibold">
                      No pudimos validar los detalles de la invitación, pero podés continuar con el pago para unirte.
                    </p>
                  </div>
                )}

                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">Precio de Acceso</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter text-primary">$5.000</span>
                    <span className="text-xs text-slate-300 font-black uppercase tracking-widest">ARS</span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-red-400 text-[11px] font-bold uppercase leading-tight animate-in fade-in">
                    {errorMessage}
                  </div>
                )}

                <button 
                  onClick={handleMercadoPagoPayment}
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#009EE3] hover:bg-[#0087C1] text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(0,158,227,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Conectando Seguro...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pagar con Mercado Pago
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-300 uppercase tracking-widest font-black">
                  Pagos procesados de forma segura
                </p>
              </div>
            ) : (
              /* ──────── CHECKOUT DE MERCADO PAGO ESTÁNDAR ──────── */
              <div className="space-y-6">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">FOUNDER PASS</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter text-primary">$5.000</span>
                  <span className="text-xs text-slate-300 font-black uppercase tracking-widest">ARS</span>
                </div>
                
                <div className="space-y-4">
                  {/* Permite definir el nombre de la liga en caliente si no viene en los query params */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-200 font-black uppercase tracking-wider block">
                      Nombre de la Liga a crear
                    </label>
                    <input
                      type="text"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                      placeholder="Ej: Los Pibes FC"
                      className="w-full px-4 py-3.5 border border-white/20 rounded-xl bg-black/60 text-white placeholder-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={loading}
                    />
                    {urlLeagueName && (
                      <p className="text-[10px] text-slate-300 font-semibold italic">
                        Precargamos el nombre ingresado al registrarte, pero podés cambiarlo si querés.
                      </p>
                    )}
                  </div>

                  {/* Campo de Código de Promoción minimalista */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="text-[11px] text-slate-200 font-black uppercase tracking-wider block">
                      Si tenés un Código de Promoción, tenés que ingresarlo aquí mismo:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Acá ingresás el código"
                        className={`w-full px-4 py-3 border rounded-xl bg-black/60 text-white placeholder-slate-300 font-bold focus:outline-none transition-all uppercase ${
                          promoValid === true 
                            ? "border-primary/50 focus:ring-2 focus:ring-primary shadow-[0_0_15px_rgba(251,191,36,0.15)]" 
                            : promoValid === false 
                              ? "border-red-500/50 focus:ring-2 focus:ring-red-500" 
                              : "border-white/20 focus:ring-2 focus:ring-primary"
                        }`}
                        disabled={loading}
                      />
                      {validatingPromo && (
                        <div className="absolute right-3 top-3">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    {promoValid === true && (
                      <p className="text-[10px] text-primary font-black uppercase tracking-wide flex items-center gap-1 animate-pulse">
                        ✓ Codigo de Promoción Aceptado !
                      </p>
                    )}
                    {promoValid === false && promoError && (
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide">
                        ⚠️ {promoError}
                      </p>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-red-400 text-[11px] font-bold uppercase leading-tight">
                      {errorMessage}
                    </div>
                  )}

                  <button 
                    onClick={handleMercadoPagoPayment}
                    disabled={loading || !leagueName.trim()}
                    className="w-full py-4 px-6 bg-[#009EE3] hover:bg-[#0087C1] text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(0,158,227,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando Seguro...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pagar con Mercado Pago
                      </>
                    )}
                  </button>
                  
                  <p className="text-[11px] text-center text-slate-300 uppercase tracking-widest font-black">
                    Pagos procesados de forma segura
                  </p>
                </div>
              </div>
            )
          )}
          
          <div className="mt-6 pt-6 border-t border-white/10 text-center flex flex-col gap-3">
            {user && (
              <span className="text-[11px] text-slate-200 font-semibold">
                Sesión iniciada como: <strong className="text-white">{user.email}</strong>
              </span>
            )}
            <Link href="/" className="text-xs text-slate-300 hover:text-white transition-colors uppercase tracking-widest font-black underline">
              Volver al Inicio
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PaywallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <PaywallContent />
    </Suspense>
  );
}
