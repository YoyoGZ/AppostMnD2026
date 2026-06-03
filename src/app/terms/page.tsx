import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Landmark, HeartHandshake, Eye } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones | MundiApp26 🏆",
  description: "Declaración de términos de uso, condiciones de juego y aviso de Fair Play en MundiApp26.",
};

export default function TermsPage() {
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
            <Landmark className="w-6 h-6 text-primary" /> Términos y Condiciones
          </h1>
          <p className="text-white/60 text-xs sm:text-sm font-semibold leading-relaxed mt-2 max-w-xl">
            Última actualización: Junio de 2026. Al ingresar o registrarte en la plataforma de MundiApp26, aceptás de forma incondicional las siguientes bases de uso.
          </p>
        </header>

        {/* Contenido en Bento Grid */}
        <main className="w-full max-w-3xl flex flex-col gap-6 relative z-10">
          
          {/* Bento 1: Fair Play */}
          <div className="bg-black/40 backdrop-blur-xl border border-primary/20 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-primary" /> 1. Aviso de Fair Play y Apuestas
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
              MundiApp26 es una plataforma recreativa diseñada exclusivamente para el entretenimiento con competencias entre amigos y compañeros de trabajo, durante el Mundial de Norteamérica. 
            </p>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold mt-3">
              <strong className="text-primary font-black">La aplicación NO gestiona ni intermedia transacciones de dinero real ni apuestas ilícitas.</strong> Cualquier premio, sorteo informal (asado, fernet o pizza) o apuesta organizada de forma externa corre pura y exclusivamente por responsabilidad del grupo de amigos creadores de cada Liga. Nosotros ponemos la tecnología; el Fair Play lo ponés vos.
            </p>
          </div>

          {/* Bento 2: Uso del Correo y Registro */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-xl">
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> 2. Registro y Datos del Usuario
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
              Para garantizar un acceso seguro e individualizado, requerimos que los usuarios se registren mediante un correo electrónico real y elijan un Alias/Apodo único para identificarse en los leaderboards y salas de chat de la liga.
            </p>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold mt-3">
              Declaramos formalmente que MundiApp26 <strong className="text-white font-black">NO vende, comparte ni expone los correos electrónicos ni los datos de perfil</strong> de nuestros usuarios a terceros con fines comerciales o de marketing. Tus datos están a salvo y son estrictamente confidenciales.
            </p>
          </div>

          {/* Bento 3: Política de Cookies Técnicas */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-xl">
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" /> 3. Uso de Cookies
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
              MundiApp26 utiliza "cookies" de navegador esenciales y almacenamiento local para su correcto funcionamiento técnico:
            </p>
            <ul className="list-disc pl-5 mt-3 text-slate-300 text-xs sm:text-sm font-semibold space-y-2">
              <li>Mantenimiento de sesión de usuario y autenticación mediante Supabase Auth.</li>
              <li>Análisis de rendimiento, latencia y tráfico interno de datos para optimizar los servidores.</li>
              <li>Guardado de estado de interfaz (como colapsar el menú lateral).</li>
            </ul>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold mt-3">
              <strong className="text-primary font-black">IMPORTANTE:</strong> No utilizamos cookies para fines publicitarios, de marketing ni de trazabilidad externa de datos de navegación.
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
          MundiApp26 · Legales 2026
        </p>
      </footer>
    </div>
  );
}
