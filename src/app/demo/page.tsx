import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LandingWrapper } from "@/components/landing/LandingWrapper";

export default function DemoPage() {
  return (
    <LandingWrapper>
      <div className="relative min-h-screen w-full bg-[#050505] text-white selection:bg-primary/30 overflow-x-hidden">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-stadium opacity-30 blur-sm">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-30 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.03)_0%,transparent_70%)]" />
        </div>

        {/* Navigation */}
        <nav className="sticky top-0 w-full z-50 px-6 py-4 backdrop-blur-md bg-black/40 border-b border-white/5 flex items-center">
            <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest">Volver al Inicio</span>
            </Link>
        </nav>

        {/* --- DEMO TOUR SECTION --- */}
        <section className="px-6 py-16 max-w-7xl mx-auto">
          <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
                  La Experiencia <span className="text-primary">Interna</span>
              </h2>
              <p className="text-white/40 text-sm max-w-2xl mx-auto">
                  No confíes solo en nuestra palabra. Descubre cómo se ve la interfaz de administración y el motor de predicciones antes de entrar a la Liga.
              </p>
          </div>

          {/* Demo Block 1: El Bracket */}
          <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
              <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                      Paso 1
                  </div>
                  <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
                      El Motor de Eliminatorias
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                      Navega por un bracket interactivo diseñado con precisión suiza. Visualiza los cruces, analiza las estadísticas en tiempo real y posiciona a tus equipos favoritos directo hacia la Gran Final.
                  </p>
              </div>
              {/* Placeholder Image / Video */}
              <div className="flex-1 w-full aspect-video bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden relative group">
                  <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white/20 text-xs font-bold uppercase tracking-widest text-center px-4">
                          [ Aquí irá tu captura HD del Bracket ]
                      </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
          </div>

          {/* Demo Block 2: Dashboard (Reversed) */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 mb-12">
              <div className="flex-1 space-y-6 md:pl-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                      Paso 2
                  </div>
                  <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
                      Tu Arsenal Táctico
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                      Un panel de control oscuro, enfocado y letal. Controla tu puntaje global, audita las posiciones de tu liga y gestiona tu Founder Pass VIP sin distracciones ni fricciones.
                  </p>
              </div>
              {/* Placeholder Image / Video */}
              <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden relative group">
                  <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white/20 text-xs font-bold uppercase tracking-widest text-center px-4">
                          [ Aquí irá tu captura HD del Dashboard / Sidebar ]
                      </p>
                  </div>
              </div>
          </div>
          
          <div className="flex justify-center mt-12">
               <button data-modal-trigger="register" className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                  Estoy Listo para Fundar mi Liga
              </button>
          </div>
        </section>

      </div>
    </LandingWrapper>
  );
}
