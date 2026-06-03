"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CorporateBentoHeaderProps {
  brandTheme: {
    id: string;
    name: string;
    logo?: string;
    accentColor: string;
    accentText?: string;
    dashboardBanner?: {
      title: string;
      description: string;
      accentBg?: string;
    };
  } | null;
}

export function CorporateBentoHeader({ brandTheme }: CorporateBentoHeaderProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Oculto por defecto para evitar hydration mismatch
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    // Verificar sessionStorage en el cliente al montarse
    if (brandTheme?.id) {
      const dismissed = sessionStorage.getItem(`brand_banner_dismissed_${brandTheme.id}`);
      if (dismissed !== "true") {
        setIsDismissed(false);
      }
    }
  }, [brandTheme]);

  if (isDismissed || !brandTheme?.dashboardBanner) {
    return null;
  }

  const handleDismiss = () => {
    setAnimateOut(true);
    setTimeout(() => {
      if (brandTheme?.id) {
        sessionStorage.setItem(`brand_banner_dismissed_${brandTheme.id}`, "true");
      }
      setIsDismissed(true);
    }, 400); // Duración de la animación de slide-up
  };

  const banner = brandTheme.dashboardBanner;

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden rounded-[24px] border backdrop-blur-xl transition-all duration-500 ease-in-out flex flex-col md:flex-row items-center justify-between p-4 md:p-6 mb-6",
        banner.accentBg ? banner.accentBg : "bg-white/[0.02] border-white/10",
        animateOut ? "opacity-0 -translate-y-4 max-h-0 py-0 my-0 border-none" : "opacity-100 translate-y-0 max-h-[500px]"
      )}
      style={{ borderColor: `${brandTheme.accentColor}20` }}
    >
      {/* Elemento de brillo decorativo de fondo */}
      <div 
        className="absolute -right-20 -top-20 w-48 h-48 rounded-full filter blur-[60px] opacity-20 pointer-events-none"
        style={{ backgroundColor: brandTheme.accentColor }}
      />
      
      <div className="flex items-center gap-4 w-full md:w-auto">
        {brandTheme.logo ? (
          <div className="shrink-0 w-28 h-10 p-1 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-lg">
            <img src={brandTheme.logo} alt={brandTheme.name} className="object-contain max-w-full max-h-full" />
          </div>
        ) : (
          <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-lg">
            <Sparkles className="w-6 h-6" style={{ color: brandTheme.accentColor }} />
          </div>
        )}
        
        <div className="flex-1 space-y-1">
          <h2 className="text-sm md:text-base font-black tracking-tight text-white flex items-center gap-2">
            {banner.title}
          </h2>
          <p className="text-white/60 text-[11px] md:text-xs font-semibold leading-relaxed max-w-2xl">
            {banner.description}
          </p>
        </div>
      </div>

      {/* Botón de Colapsar */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 md:relative md:top-0 md:right-0 ml-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/5 hover:border-white/10 focus:outline-none"
        aria-label="Cerrar banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
