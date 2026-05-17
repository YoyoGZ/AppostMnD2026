"use client";

import React, { useState, Suspense } from "react";
import { Shield, CreditCard, CheckCircle2, ChevronRight, Zap, Loader2 } from "lucide-react";
import { createPaymentPreferenceAction } from "@/app/actions/payments";
import { createLeagueAction } from "@/app/actions/leagues";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function PaywallContent() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueName = searchParams.get('leagueName');

  const handleMercadoPagoPayment = async () => {
    setLoading(true);
    
    if (!leagueName) {
      alert("No se encontró el nombre de la liga. Por favor volvé al inicio.");
      router.push('/');
      return;
    }

    try {
      const res = await createPaymentPreferenceAction(leagueName);
      
      if (res?.error) {
        alert(res.error);
        setLoading(false);
      } else if (res?.initPoint) {
        // Redirigir al Checkout Oficial de Mercado Pago
        window.location.href = res.initPoint;
      }
    } catch (error: any) {
      console.error("Error de conexión:", error);
      alert("Error conectando con Mercado Pago. Intentá nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.15)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="w-full max-w-4xl p-6 flex flex-col md:flex-row gap-8 items-center z-10">
        
        {/* Left Side: Value Prop */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Zap className="w-3 h-3 fill-current" /> Onboarding Exclusivo
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1]">
            {leagueName ? (
              <>ACTIVÁ TU LIGA <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white uppercase">"{leagueName}"</span></>
            ) : (
              <>CONSEGUÍ TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">FOUNDER PASS</span></>
            )}
          </h1>
          
          <p className="text-white/60 text-sm md:text-base font-medium leading-relaxed max-w-md">
            {leagueName 
              ? `¡Excelente elección! La liga "${leagueName}" ya está reservada. Activá tu franquicia para abrirle la puerta a tus 9 amigos.`
              : "Para armar una Liga Privada y convertirte en el Capitán, necesitás activar tu entrada a la App. Un único pago te da acceso para vos y hasta 9 amigos."
            }
          </p>
          
          <ul className="space-y-4 mt-8">
            {[
              "Creación de 1 Liga Privada (10 cupos).",
              "Los amigos entrán con tus links de invitacion.",
              "Panel de Administración de Liga y Duelos.",
              "Acceso al Sorteo Exclusivo de la Camiseta de la Selección."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-white/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Right Side: Pricing Card */}
        <div className="w-full md:w-[400px] bg-white/[0.03] border border-white/10 rounded-[32px] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Shield className="w-24 h-24 text-primary/10 -rotate-12" />
          </div>
          
          <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">FOUNDER PASS</h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-black tracking-tighter text-primary">$50.000</span>
            <span className="text-xs text-white/40 font-bold uppercase tracking-widest">ARS</span>
          </div>
          
          <div className="space-y-4">
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
            
            <p className="text-[10px] text-center text-white/40 uppercase tracking-widest font-bold">
              Pagos procesados de forma segura
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link href="/" className="text-xs text-white/50 hover:text-white transition-colors uppercase tracking-widest font-bold">
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
