"use client";

import React, { useState, useEffect, useRef } from "react";
import { Smartphone, Download, X, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";

const PRODUCTION_URL = "https://mundiapp26.com";

/**
 * PWA Install Button - Túnel de Instalación Universal
 * 
 * Comportamiento:
 * - En Producción (Vercel): lanza el prompt nativo del navegador.
 * - En Localhost/Dev: redirige automáticamente a producción con ?action=install
 *   para que el usuario instale siempre la versión oficial y persistente.
 * - En iOS (producción): muestra instrucciones del flujo manual de Safari.
 * - Si llega a producción con ?action=install: dispara el prompt automáticamente.
 */
export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const autoInstallAttempted = useRef(false);
  const searchParams = useSearchParams();

  const isLocalEnv = () => {
    const hostname = window.location.hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168") ||
      hostname.startsWith("10.")
    );
  };

  useEffect(() => {
    // Verificar si ya está instalado (Standalone mode)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Capturar el evento nativo (Android / Chrome Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("✅ beforeinstallprompt fired");
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Auto-disparar instalación si llegamos desde el túnel (?action=install)
  useEffect(() => {
    const action = searchParams.get("action");
    if (action !== "install" || autoInstallAttempted.current || isStandalone) return;

    autoInstallAttempted.current = true;

    // Esperar a que el browser registre el evento beforeinstallprompt
    const timer = setTimeout(() => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
      } else if (isIOS) {
        setShowIOSModal(true);
      }
      // Limpiar el parámetro de la URL para que no quede expuesto
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url.toString());
    }, 800);

    return () => clearTimeout(timer);
  }, [deferredPrompt, isIOS, isStandalone, searchParams]);

  const handleInstallClick = async () => {
    // Túnel: Si estamos en entorno local, redirigir a producción
    if (isLocalEnv()) {
      setRedirecting(true);
      // Pequeño delay para mostrar el feedback visual antes de redirigir
      setTimeout(() => {
        window.location.href = `${PRODUCTION_URL}/dashboard?action=install`;
      }, 600);
      return;
    }

    // En producción: flujo normal
    if (isIOS) {
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } else {
      alert(
        "Tu navegador actual no soporta la instalación directa o la app ya está instalada. Intenta desde Chrome o Safari."
      );
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Botón Principal */}
      <button
        onClick={handleInstallClick}
        disabled={redirecting}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all group shadow-[0_0_15px_rgba(251,191,36,0.1)] disabled:opacity-70"
      >
        {redirecting ? (
          <Zap className="w-3.5 h-3.5 animate-pulse" />
        ) : (
          <Smartphone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        )}
        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
          {redirecting ? "ABRIENDO..." : "INSTALL"}
        </span>
      </button>

      {/* Modal: Instrucciones iOS (solo en producción) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowIOSModal(false)}
          />
          <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white bg-white/5 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mb-6 mt-2">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">
              Instalar en iOS
            </h3>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Safari no permite instalar apps automáticamente. Para agregarla a tu pantalla de inicio:
            </p>
            <div className="w-full space-y-3 text-left">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center font-bold text-primary shrink-0">
                  1
                </div>
                <p className="text-sm text-white/80">
                  Toca el ícono de <strong className="text-white">Compartir</strong> en la barra
                  inferior de tu navegador.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center font-bold text-primary shrink-0">
                  2
                </div>
                <p className="text-sm text-white/80">
                  Selecciona <strong className="text-white">Agregar a Inicio</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-6 py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] transition-transform"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
