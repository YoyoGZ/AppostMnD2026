import React, { Suspense } from "react";
import { LoginShield } from "@/components/auth/LoginShield";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center relative">
      {/* Backdoor Return */}
      <Link 
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
      >
        <ChevronLeft className="w-4 h-4" /> Volver a Landing
      </Link>
      
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-2xl animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Iniciando Escudo de Acceso...</p>
          </div>
        }>
          <LoginShield />
        </Suspense>
      </div>
    </div>
  );
}
