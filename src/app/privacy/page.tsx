import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, EyeOff, Cookie, Lock } from "lucide-react";

export const metadata = {
  title: "Políticas de Privacidad | MundiApp26 🏆",
  description: "Bases de seguridad de datos, privacidad del correo y política de cookies de uso interno en MundiApp26.",
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-between bg-[#05070a] overflow-y-auto">
      {/* Fondo de Estadio Nocturno */}
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

      <div className="flex-1 w-full flex flex-col items-center px-4 py-10 sm:py-16">
        {/* Cabecera */}
        <header className="mb-10 text-center flex flex-col items-center w-full max-w-2xl">
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
          
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Políticas de Privacidad
          </h1>
          <p className="text-white/60 text-xs sm:text-sm font-semibold leading-relaxed mt-2 max-w-xl">
            Tus datos de juego y tu identidad son 100% tuyos. En MundiApp26 aplicamos los estándares de seguridad necesarios para <strong className="text-white font-black">blindar tu información.</strong>
          </p>
        </header>

        {/* Contenido */}
        <main className="w-full max-w-3xl flex flex-col gap-6 relative z-10">
          
          {/* Bento 1: No comercialización de datos */}
          <div className="bg-black/40 backdrop-blur-xl border border-primary/20 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-primary" /> Privacidad Absoluta de tu Cuenta
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
              El correo electrónico que nos provees en el formulario de registro se procesa síncronamente mediante Supabase Auth y se encripta nativamente. 
            </p>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold mt-3">
              <strong className="text-white font-black">Declaramos formalmente que la App NO comercializa ni comparte datos</strong> de perfiles, apodos, pronósticos o correos con ninguna agencia de publicidad o empresa comercial externa. La información solo se almacena para procesar tu participación y los rankings en tu Liga.
            </p>
          </div>

          {/* Bento 2: Cookies Técnicas */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-xl">
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" /> Cookies y Almacenamiento Local
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
              ¿Para qué usamos cookies? Aceptamos y declaramos que la App incorpora cookies de almacenamiento, pero con propósitos exclusivamente técnicos:
            </p>
            <ul className="list-disc pl-5 mt-3 text-slate-300 text-xs sm:text-sm font-semibold space-y-2">
              <li>Para mantenerte logueado de forma segura entre recargas de la página.</li>
              <li>Para medir tiempos de carga y latencia con el fin de optimizar el rendimiento y el tráfico de datos.</li>
              <li>Para recordar configuraciones visuales del panel.</li>
            </ul>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold mt-3">
              <strong className="text-primary font-black">NO poseemos integraciones de cookies para marketing,</strong> publicidad conductual ni de seguimiento/rastreo de navegación en otras páginas.
            </p>
          </div>

          {/* Bento 3: Seguridad de Infraestructura */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-xl">
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Seguridad de Supabase
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
              Toda la infraestructura de persistencia de MundiApp26 corre sobre servidores en la nube de alta disponibilidad de Supabase (respaldados en AWS), garantizando la inmutabilidad física de tus datos. Adicionalmente, el Row Level Security (RLS) protege que nadie pueda acceder o alterar tus datos o pronósticos.
            </p>
          </div>

          {/* Botón Volver */}
          <div className="flex justify-center mt-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-white/30 hover:text-white/50 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio
            </Link>
          </div>

        </main>
      </div>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-6 opacity-30 shrink-0">
        <p className="text-[9px] uppercase font-bold tracking-widest text-white">
          MundiApp26 · Privacidad 2026
        </p>
      </footer>
    </div>
  );
}
