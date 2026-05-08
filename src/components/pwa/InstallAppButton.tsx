"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Download, X } from "lucide-react";

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalado (Standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Detectar iOS para mostrar las instrucciones manuales (Safari no permite prompt automático)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Atrapar el evento nativo en Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Si no es iOS y no hay deferred prompt, puede que el navegador no lo soporte o ya esté instalada
      alert("Tu navegador actual no soporta la instalación directa o la app ya está instalada. Intenta desde Chrome o Safari.");
    }
  };

  if (isStandalone) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="w-full mt-2 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all group shadow-[0_0_15px_rgba(251,191,36,0.1)]"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/20 group-hover:bg-black/20 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="flex flex-col text-left overflow-hidden">
          <span className="text-[11px] font-black uppercase tracking-widest leading-none truncate">Instalar App</span>
          <span className="text-[9px] opacity-70 font-medium truncate">Acceso rápido desde el celular</span>
        </div>
        <Download className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      {/* Modal Instrucciones iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowIOSModal(false)} />
          <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowIOSModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white bg-white/5 p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mb-6 mt-2">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Instalar en iOS</h3>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Safari no permite instalar apps automáticamente. Para agregarla a tu pantalla de inicio:
            </p>
            <div className="w-full space-y-3 text-left">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center font-bold text-primary shrink-0">1</div>
                <p className="text-sm text-white/80">Toca el ícono de <strong className="text-white">Compartir</strong> en la barra inferior de tu navegador.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center font-bold text-primary shrink-0">2</div>
                <p className="text-sm text-white/80">Selecciona <strong className="text-white">Agregar a Inicio</strong>.</p>
              </div>
            </div>
            <button onClick={() => setShowIOSModal(false)} className="w-full mt-6 py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] transition-transform">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
