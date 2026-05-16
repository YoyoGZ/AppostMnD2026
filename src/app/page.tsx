import React from "react";
import Image from "next/image";
import { LandingWrapper } from "@/components/landing/LandingWrapper";
import { Shield, LayoutDashboard, Users, Ticket, Zap, ChevronRight, Play, Swords } from "lucide-react";
import Link from "next/link";
import { getLeagueByInvite } from "@/app/actions/leagues";

/**
 * Landing Page Premium - Mundial 2026
 * Diseñada para impacto visual y conversión (Sales Funnel).
 */
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home(props: PageProps) {
  const searchParams = await props.searchParams;
  const inviteCode = typeof searchParams?.invite === 'string' ? searchParams.invite : undefined;

  let leagueInfo = null;
  if (inviteCode) {
    const res = await getLeagueByInvite(inviteCode);
    if (res && !('error' in res)) {
      leagueInfo = res;
    }
  }

  return (
    <LandingWrapper>
      <div className="relative min-h-screen w-full bg-[#050505] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-30 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.03)_0%,transparent_70%)]" />
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 w-full z-50 px-6 py-4 backdrop-blur-md bg-black/20 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/login" title="Backdoor to Login" className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer overflow-hidden shadow-[0_0_20px_rgba(251,191,36,0.15)]">
            <Image
              src="/icon-192x192.png"
              alt="Mundial App 2026"
              width={40}
              height={40}
              className="w-10 h-10 object-cover"
              priority
            />
          </Link>
          <span className="font-black tracking-[0.2em] text-sm uppercase hidden sm:block">Mundial 2026</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="px-4 py-2 bg-transparent border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/5 hover:border-white/40 transition-colors">
                Ingresar
            </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- full-width para permitir pill al borde real */}
      <section className="relative w-full pt-20 pb-32 px-6 flex flex-col items-center text-center overflow-visible">

        {/* SCROLL PILL — borde derecho real de la pantalla, solo desktop */}
        <a
          href="#sorteo"
          aria-label="Ver sorteo de camiseta"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 flex-col items-center gap-3 px-4 py-5 rounded-l-2xl border border-r-0 border-[#74b9ff]/30 bg-black/70 backdrop-blur-md hover:border-[#74b9ff]/60 hover:bg-[#74b9ff]/10 transition-all duration-300 group z-10"
        >
          <div className="flex flex-col items-center gap-[4px]">
            {['S','O','R','T','E','O'].map((letter, i) => (
              <span key={i} className="text-[#74b9ff] text-[12px] font-black uppercase leading-none">{letter}</span>
            ))}
          </div>
          <span className="text-xl leading-none">🇦🇷</span>
          <svg className="w-4 h-4 text-[#74b9ff] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>

        {/* Contenido centrado dentro del Hero */}
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-8 animate-bounce">
              <Zap className="w-3 h-3 fill-current" />
              Experiencia de Siguiente Generación
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
              DOMINA EL <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-gradient">MUNDIAL 2026</span>
          </h1>

          <p className="text-white/50 text-sm md:text-lg max-w-2xl font-medium leading-relaxed mb-10">
              La plataforma de pronósticos más avanzada para el Mundial de Norteamérica.
              Generá tu Liga, desafía a tus amigos y viví toda la competencia con datos en tiempo real y una interfaz diseñada para la victoria.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button data-modal-trigger="register" className="px-8 py-4 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:translate-y-[-2px] transition-all group w-full sm:w-auto justify-center">
                  Quiero Registrarme Ahora
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link href="/demo" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center gap-3 backdrop-blur-md hover:bg-white/10 transition-all w-full sm:w-auto justify-center">
                  <Play className="w-4 h-4 fill-white" />
                  Explorar Demo
              </Link>
          </div>
        </div>

      </section>

      {/* --- MOBILE SORTEO BANNER — solo visible en celular (md:hidden) --- */}
      <a
        href="#sorteo"
        className="md:hidden flex items-center justify-between mx-4 mb-8 px-5 py-3 rounded-2xl border border-[#74b9ff]/30 bg-[#74b9ff]/8 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🇦🇷</span>
          <span className="text-[#74b9ff] text-[11px] font-black uppercase tracking-[0.2em]">¡Hay Sorteo!</span>
        </div>
        <svg className="w-4 h-4 text-[#74b9ff] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </a>

      {/* --- BENTO GRID FEATURES --- */}
      <section id="features" className="px-6 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          
          {/* Card 1: VIP Pass (First, col-span-2) */}
          <div className="md:col-span-2 relative group overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-8 flex flex-col justify-end hover:border-primary/40 transition-all duration-500">
            <div className="absolute top-8 right-8 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Ticket className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-primary">Founder Pass VIP</h3>
            <p className="text-white/60 text-sm max-w-md">El Fundador de la Liga tendrá acceso exclusivo a funciones avanzadas, oráculo de predicciones y Gestión de la Liga generada para sus amigos.</p>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[60px] -z-10" />
          </div>

          {/* Card 2: Ligas Multi-League */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-8 flex flex-col justify-end hover:border-primary/40 transition-all duration-500">
            <div className="absolute top-8 right-8 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-primary">Multi-Ligas</h3>
            <p className="text-white/60 text-sm max-w-md">Podes generar las ligas privadas que quieras, invitás a tus otros Capitanes y podes participar en múltiples torneos simultáneos.</p>
          </div>

          {/* Card 3: Dashboard */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-8 flex flex-col justify-end hover:border-primary/40 transition-all duration-500">
            <div className="absolute top-8 right-8 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-primary">Dashboard Ejecutivo</h3>
            <p className="text-white/60 text-sm max-w-md">Analítica visual de puntos y tablas completas de la Competencia.</p>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent -z-10" />
          </div>

          {/* Card 4: Oráculo / Competencia (Replaces Motor Eliminatorias) */}
          <div className="md:col-span-2 relative group overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-8 flex flex-col justify-end hover:border-primary/40 transition-all duration-500">
            <div className="absolute top-8 right-8 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Swords className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-primary">Liga de Pronósticos</h3>
            <p className="text-white/60 text-sm max-w-md">La competencia central. Los participantes pronostican los resultados de los partidos de La Liga, plantean duelos entre ellos y compiten por el primer puesto de Medallas, antes de que el Oráculo selle el destino.</p>
          </div>

        </div>
      </section>

      {/* --- FUNCIONAMIENTO GENERAL & LOREM IPSUM --- */}
      <section className="px-6 py-24 max-w-4xl mx-auto text-center border-t border-white/5">
        
        {/* Advertencia / Disclaimer */}
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl mb-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <Image src="/icon-192x192.png" alt="Mundial App" width={48} height={48} className="mx-auto mb-4 opacity-90" />
            <h4 className="text-primary font-black uppercase tracking-widest text-sm mb-2">Aviso Importante</h4>
            <p className="text-white/70 text-sm leading-relaxed max-w-2xl mx-auto">
                Incentivamos una competencia entre amigos, estratégica y orientada a crear experiencias memorables. Nuestra Plataforma <strong className="text-white">NO</strong> está diseñada para apuestas con dinero real u otros activos.
            </p>
        </div>

        {/* Bloque Extenso de Lorem Ipsum para completar */}
        <div className="space-y-6 text-white/50 text-sm md:text-base leading-loose text-left bg-white/[0.02] p-8 md:p-12 border border-white/5 rounded-[40px]">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-8 text-center">Funcionamiento General de la Propuesta</h3>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <p>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. 
            </p>
            <p>
                Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi.
            </p>
            <p>
                Aliquam pulvinar vestibulum blandit. Nunc egestas, augue at pellentesque laoreet, felis eros vehicula leo, at malesuada velit leo quis pede. Donec interdum, metus et hendrerit aliquet, dolor diam sagittis ligula, eget egestas libero turpis vel mi. Nunc nulla. Phasellus accumsan cursus velit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed aliquam, nisi quis porttitor congue, elit erat euismod orci, ac placerat dolor lectus quis orci.
            </p>
        </div>

      </section>

      {/* --- SORTEO CAMISETA ARGENTINA --- */}
      <section id="sorteo" className="px-6 py-20 max-w-7xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card A: Imagen (placeholder para futura imagen) */}
          <div className="relative group overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#1a2744] to-[#0a0f1e] flex items-center justify-center min-h-[320px] hover:border-white/20 transition-all duration-500">
            {/* Fondo decorativo celeste/azul argentina */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(116,185,255,0.08)_0%,transparent_70%)]" />
            <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-[#74b9ff]/40" />
            <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-[#74b9ff]/20" />

            {/* Placeholder visual / Imagen Oficial */}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center p-8 w-full h-full justify-center">
              <div className="relative w-48 h-48 md:w-56 md:h-56 drop-shadow-[0_0_40px_rgba(116,185,255,0.4)] hover:scale-110 hover:rotate-2 transition-all duration-500">
                {/* Asegúrate de colocar la imagen generada en public/assets/camiseta.png */}
                <Image 
                  src="/assets/camiseta.png" 
                  alt="Camiseta Oficial Argentina"
                  fill
                  className="object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Diagonal stripe decorativa argentina */}
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #74b9ff 0, #74b9ff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}
            />
          </div>

          {/* Card B: Texto del sorteo */}
          <div className="relative group overflow-hidden rounded-[32px] border border-[#74b9ff]/20 bg-gradient-to-br from-[#0f1e3d] via-[#0a1428] to-[#050505] p-8 md:p-10 flex flex-col justify-between min-h-[320px] hover:border-[#74b9ff]/40 transition-all duration-500">

            {/* Glow celeste */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#74b9ff]/10 blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none" />

            {/* Badge Argentina */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#74b9ff]/10 border border-[#74b9ff]/20 text-[#74b9ff] text-[10px] font-black uppercase tracking-widest mb-6 w-fit">
              <span>🇦🇷</span>
              Sorteo Exclusivo · Fundadores
            </div>

            {/* Título */}
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight text-white mb-6">
              Ganá una{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74b9ff] to-white">
                Camiseta Oficial
              </span>{" "}
              de la Selección Argentina
            </h3>

            {/* Cuerpo */}
            <p className="text-white/65 text-base leading-relaxed mb-6">
              Entre los primeros{" "}
              <strong className="text-white font-black">50 fundadores</strong>{" "}
              que se registren en la App para formar su propia Liga y completen su grilla con{" "}
              <strong className="text-white font-black">nueve amigos</strong>{" "}
              (enviando los links de invitación) sortearemos una{" "}
              <strong className="text-white">camiseta Oficial</strong>.
            </p>

            {/* CTA texto final */}
            <p className="text-primary font-black uppercase tracking-[0.15em] text-sm">
              ¡Sé uno de los 50. A ganarla! 🏆
            </p>

            {/* Contador decorativo */}
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#74b9ff]/40" />
                ))}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-white/10" />
                ))}
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Plazas limitadas</span>
            </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="w-full border-t border-white/5 py-12 px-6 text-center">
        <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.5em] mb-4">
          Powered by <span className="text-primary">Antigravity Engine</span>
        </p>
        <div className="flex justify-center gap-8 mb-6">
            <a href="#" className="text-[9px] uppercase font-bold text-white/40 hover:text-white transition-colors">Términos</a>
            <a href="#" className="text-[9px] uppercase font-bold text-white/40 hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="text-[9px] uppercase font-bold text-white/40 hover:text-white transition-colors">Soporte</a>
        </div>
        <p className="text-[8px] text-white/20 uppercase font-medium tracking-widest">
          © 2026 MUNDIAL APP ARENA — Todos los derechos reservados.
        </p>
      </footer>

      </div>
    </LandingWrapper>
  );
}
