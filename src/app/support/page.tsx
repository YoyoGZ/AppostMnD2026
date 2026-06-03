import React from "react";
import { createClient } from "@/utils/supabase/server";
import { SupportClientForm } from "./SupportClientForm";
import Image from "next/image";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export const metadata = {
  title: "Soporte Técnico y Contacto | MundiApp26 🏆",
  description: "¿Tenés dudas o tuviste un inconveniente? Envianos tu consulta y la resolveremos de inmediato.",
};

export default async function SupportPage() {
  const supabase = await createClient();
  
  // Intentar obtener el usuario actual para precargar datos en el formulario client-side
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  const defaultEmail = user?.email || "";
  const defaultAlias = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-between bg-[#05070a] overflow-y-auto">
      {/* Fondo de Estadio Nocturno Premium */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-primary/5 via-background to-transparent -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-primary/10 rounded-full blur-[110px] -z-10 pointer-events-none opacity-40" />

      {/* Marca de agua colosal */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden flex items-center justify-center">
        <div className="relative w-[150vw] h-[150vw] md:w-[65vw] md:h-[65vw] opacity-[0.025] blur-[15px] rotate-[15deg]">
          <Image
            src="/assets/logo_oficial.png"
            alt="Watermark Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        {/* Cabecera de la página */}
        <header className="mb-8 text-center flex flex-col items-center w-full max-w-md">
          <Link href="/" className="hover:scale-105 transition-transform duration-300 mb-4">
            <div className="w-16 h-16 relative drop-shadow-[0_0_20px_rgba(251,191,36,0.2)]">
              <Image
                src="/assets/logo_oficial.png"
                alt="MundiApp26 Logo Oficial"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-primary" /> Soporte Técnico
          </h1>
          <p className="text-white/60 text-xs sm:text-sm font-semibold leading-relaxed mt-2">
            ¿Tuviste un problema de acceso o querés recuperar tu clave? Envianos tu mensaje y te ayudamos.
          </p>
        </header>

        {/* Formulario Interactivo Client-side */}
        <main className="w-full max-w-md relative z-10">
          <SupportClientForm defaultEmail={defaultEmail} defaultAlias={defaultAlias} />
        </main>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-6 opacity-30 shrink-0">
        <p className="text-[9px] uppercase font-bold tracking-widest text-white">
          MundiApp26 · Soporte Corporativo
        </p>
      </footer>
    </div>
  );
}
