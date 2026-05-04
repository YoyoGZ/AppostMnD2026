"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Shield, Plus, ArrowRight, Loader2, Users } from "lucide-react";
import { createLeagueAction, getLeagueByInvite, joinLeagueAction } from "@/app/actions/leagues";
import { useSearchParams } from "next/navigation";

function OnboardingContent() {
  const [loading, setLoading] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState<any>(null);
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  console.log(`📡 [ONBOARDING] Código detectado en URL: ${inviteCode || 'NULL'}`);

  useEffect(() => {
    if (inviteCode) {
      getLeagueByInvite(inviteCode).then(res => {
        console.log("📥 [ONBOARDING] Resultado de getLeagueByInvite:", res);
        if (res && !('error' in res)) {
          setLeagueInfo(res);
        } else {
          console.error("❌ [ONBOARDING] Error obteniendo liga:", res?.error);
        }
      });
    }
  }, [inviteCode]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md px-4 py-12">
      <header className="mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-black/40 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
          <Shield className="w-8 h-8 text-primary drop-shadow-md" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
          {leagueInfo ? <>BIENVENIDO A <span className="text-primary">{leagueInfo.name}</span></> : <>TÚ ERES EL <span className="text-primary">CAPITÁN</span></>}
        </h1>
        <p className="text-white/50 text-sm mt-3 font-medium px-4">
          {leagueInfo ? (
            <>Has sido reclutado por <strong className="text-white">{leagueInfo.captainAlias}</strong> para competir en esta Arena.</>
          ) : (
            <>No tienes una Arena asignada. Es tu momento de crear una liga privada e invitar a tus amigos.</>
          )}
        </p>
      </header>

      <div className="w-full bento-card bg-card-body/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>
        
        <div className="p-8">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> {leagueInfo ? "Tu Nueva Arena" : "Reglas de la Arena"}
          </h2>
          {leagueInfo ? (
            <div className="flex flex-col gap-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <p className="text-xs text-white/70 leading-relaxed text-center">
                  Estás a un paso de entrar al campo de batalla. Al unirte, podrás ver la clasificación en tiempo real y empezar a subir tus pronósticos.
                </p>
              </div>
              <button
                onClick={async () => {
                  setLoading(true);
                  await joinLeagueAction(inviteCode!);
                }}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>¡Entrar a la Arena! <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-4 mb-8">
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/10"><span className="text-[10px] font-black text-primary">1</span></div>
                  <p className="text-xs text-white/70 leading-relaxed">Exclusividad total: Solo hay <strong className="text-white">10 cupos</strong> máximos por Arena.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/10"><span className="text-[10px] font-black text-primary">2</span></div>
                  <p className="text-xs text-white/70 leading-relaxed">Las predicciones se bloquean en el instante que inicia el partido real.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/10"><span className="text-[10px] font-black text-primary">3</span></div>
                  <p className="text-xs text-white/70 leading-relaxed">Como capitán, obtendrás un "Magic Link" para invitar directamente por WhatsApp.</p>
                </li>
              </ul>

              <form action={async (formData) => {
                setLoading(true);
                const res = await createLeagueAction(formData);
                if (res?.error) {
                  alert(res.error);
                  setLoading(false);
                }
              }} className="flex flex-col gap-4">
                <div className="relative">
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Ej: Los Galácticos, La Scaloneta..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/50 placeholder:font-medium"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>Funda tu Arena <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background overflow-y-auto">
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50" />
      
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}
