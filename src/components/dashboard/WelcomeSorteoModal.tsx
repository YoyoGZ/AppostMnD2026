"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Award, Star, Loader2, Sparkles, ShieldCheck, Building2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

interface WelcomeSorteoModalProps {
  leagueNumber: number | null;
  alreadyShown: boolean;
  isCorporate?: boolean;
  corporateBrandName?: string | null;
}

export function WelcomeSorteoModal({ 
  leagueNumber, 
  alreadyShown,
  isCorporate = false,
  corporateBrandName = null
}: WelcomeSorteoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Evitar destellos de hidratación y verificar condiciones en el cliente
    if (!alreadyShown && leagueNumber !== null) {
      setIsOpen(true);
      // Disparar animación de entrada en el siguiente frame
      const timer = setTimeout(() => setAnimateIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [alreadyShown, leagueNumber]);

  if (!isOpen) return null;

  const handleClose = async () => {
    setClosing(true);
    try {
      const supabase = createClient();
      
      // Persistencia atómica en los metadatos del usuario en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: { welcome_sorteo_shown: true }
      });

      if (error) throw error;
      
      // Animación suave de desvanecimiento
      setAnimateIn(false);
      setTimeout(() => {
        setIsOpen(false);
      }, 500);

    } catch (err) {
      console.error("❌ Error al guardar estado de bienvenida en Supabase Auth:", err);
      // Fallback de resiliencia: cerrar de todas formas para no trabar al usuario
      setAnimateIn(false);
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-700 ease-in-out select-none",
        animateIn ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop de desenfoque ultra-profundo con la marca de agua del logo */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl overflow-hidden flex items-center justify-center pointer-events-none">
        
        {/* Marca de agua colosal del logo oficial en el fondo */}
        <div 
          className="absolute w-[200vw] md:w-[75vw] h-[200vw] md:h-[75vw] opacity-[0.035] filter blur-[15px] md:blur-[25px] transform rotate-12 transition-all duration-1000 select-none animate-pulse"
          style={{
            backgroundImage: "url('/assets/logo_oficial.png')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            animationDuration: "10s"
          }}
        />

        {/* Glow ambientador radial detrás de la tarjeta para otorgar volumen */}
        <div 
          className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full bg-primary/5 filter blur-[100px] md:blur-[150px] mix-blend-screen" 
          style={{ backgroundColor: "rgba(250,204,21,0.06)" }}
        />
      </div>

      {/* Tarjeta Bento Glassmorphic Flotante */}
      <div 
        className={cn(
          "relative w-full max-w-lg bg-[#07090d]/85 border border-white/10 rounded-[36px] p-6 md:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.9)] backdrop-blur-3xl overflow-hidden text-center z-10 transition-all duration-700 ease-out transform",
          animateIn ? "scale-100 translate-y-0" : "scale-90 translate-y-8"
        )}
        style={{ borderColor: "rgba(250,204,21,0.2)" }}
      >
        {/* Glows dorados holográficos decorativos dentro de la tarjeta */}
        <div className="absolute -left-24 -top-24 w-48 h-48 rounded-full bg-primary/10 filter blur-[60px] pointer-events-none" />
        <div className="absolute -right-24 -bottom-24 w-48 h-48 rounded-full bg-primary/10 filter blur-[60px] pointer-events-none" />

        {/* Medallón de Trofeo / Logro */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 bg-primary/10 border border-primary/30 rounded-[24px] mb-6 shadow-inner animate-pulse">
          {isCorporate ? (
            <Building2 className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
          ) : (
            <Trophy className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
          )}
          <Sparkles className="absolute -top-1.5 -right-1.5 w-5 h-5 text-primary fill-primary animate-bounce" />
        </div>

        {/* Título de Alto Impacto */}
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-3">
          {isCorporate ? "¡ BIENVENIDO SOCIO CORPORATIVO ! 🏢" : "¡ BIENVENIDO CAPITÁN ! ⚽"}
        </h2>
        
        <p className="text-white/60 text-xs md:text-sm font-semibold leading-relaxed max-w-sm mx-auto mb-6">
          {isCorporate 
            ? `Activaste tu Pase de Liga corporativo con éxito. Oficialmente has inaugurado la arena de ${corporateBrandName || "tu Empresa"} en la app, ya podés linkear a tus compañeros.`
            : "Activaste tu Pase con éxito. Oficialmente has inaugurado tu propia Liga en la app, ya podés linkear a tus amigos."
          }
        </p>

        {/* Elegant Bento Card (Contenido Condicional basado en Rol/Exclusión) */}
        {isCorporate ? (
          /* Bento Corporativo (Excluye la camiseta de Argentina) */
          <div 
            className="bg-gradient-to-br from-[#121620]/60 via-black/40 to-black border rounded-[24px] p-5 md:p-6 mb-8 text-left relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-primary/30"
            style={{ borderColor: "rgba(250,204,21,0.1)" }}
          >
            <div className="absolute -right-6 -bottom-6 p-0 opacity-5 pointer-events-none">
              <Award className="w-32 h-32 text-primary -rotate-12" />
            </div>

            <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
              <Star className="w-3.5 h-3.5 fill-primary" /> Credenciales de Marca
            </div>
            
            <p className="text-white text-sm md:text-base font-bold leading-relaxed tracking-wide">
              Sos el Creador de la Liga Nro <span className="text-primary text-xl md:text-2xl font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">{leagueNumber}</span> de tu Empresa, estate atento al fixture interno y competí con tus colegas.
            </p>
          </div>
        ) : (
          /* Bento Regular (Incluye el Sorteo de la Camiseta) */
          <div 
            className="bg-gradient-to-br from-[#121620]/60 via-black/40 to-black border rounded-[24px] p-5 md:p-6 mb-8 text-left relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-primary/30"
            style={{ borderColor: "rgba(250,204,21,0.1)" }}
          >
            <div className="absolute -right-6 -bottom-6 p-0 opacity-5 pointer-events-none">
              <Award className="w-32 h-32 text-primary -rotate-12" />
            </div>

            <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
              <Star className="w-3.5 h-3.5 fill-primary" /> Credenciales Oficiales
            </div>
            
            <p className="text-white text-sm md:text-base font-bold leading-relaxed tracking-wide">
              Sos el Creador de Liga Nro <span className="text-primary text-xl md:text-2xl font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">{leagueNumber}</span>, estate atento al sorteo de la camiseta, te lo comunicaremos a tu email
            </p>
          </div>
        )}

        {/* Gran Botón de Cierre Obligatorio */}
        <button
          onClick={handleClose}
          disabled={closing}
          className="w-full py-4 px-6 bg-primary hover:bg-primary/95 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_12px_25px_rgba(250,204,21,0.3)] disabled:opacity-50"
          style={{ backgroundColor: "#facc15" }}
        >
          {closing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              ACCEDIENDO A LA ARENA...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 shrink-0 fill-black/20" />
              {isCorporate ? "¡ VAMOS POR ESA COPA ! ⚽" : "¡ VAMOS POR ESA CAMISETA ! 🇦🇷"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
