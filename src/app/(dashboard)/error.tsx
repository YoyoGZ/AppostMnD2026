"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

/**
 * Error Boundary global para las rutas del dashboard.
 * Captura errores de runtime y ofrece recuperación al usuario.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en Dashboard:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Ícono de error */}
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      <h2 className="text-2xl font-black text-white mb-2">
        Algo salió mal
      </h2>
      <p className="text-white/50 text-sm max-w-md mb-8 leading-relaxed">
        Ocurrió un error inesperado. Puedes intentar recargar la sección o volver al inicio.
      </p>

      {/* Acciones de recuperación */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-white/70 font-bold text-sm rounded-xl hover:bg-white/10 hover:text-white transition-all"
        >
          <Home className="w-4 h-4" />
          Inicio
        </Link>
      </div>

      {/* Código de error (solo dev) */}
      {error.digest && (
        <p className="mt-8 text-[10px] text-white/20 font-mono uppercase tracking-wider">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
