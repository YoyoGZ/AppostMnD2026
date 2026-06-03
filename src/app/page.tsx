import React, { Suspense } from "react";
import Image from "next/image";
import { LandingWrapper } from "@/components/landing/LandingWrapper";
import { Shield, LayoutDashboard, Users, Ticket, Zap, ChevronRight, Play, Swords } from "lucide-react";
import Link from "next/link";
import { getLeagueByInvite } from "@/app/actions/leagues";
import { LandingNavActions, LandingNavActionsFallback } from "@/components/landing/LandingNavActions";
import { LandingHeroActions, LandingHeroActionsFallback } from "@/components/landing/LandingHeroActions";

/**
 * Landing Page Premium - MundiApp26
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
      <nav className="sticky top-0 w-full z-50 px-6 py-3 backdrop-blur-md bg-black/20 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:scale-105 transition-transform cursor-pointer">
            <span className="font-black tracking-[0.25em] text-lg md:text-xl text-primary">MundiApp26</span>
          </Link>
        </div>
        <Suspense fallback={<LandingNavActionsFallback />}>
          <LandingNavActions />
        </Suspense>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative w-full pt-10 pb-12 px-6 flex flex-col items-center text-center overflow-visible">

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
          {/* Gran Isotipo Central de Marca Ampliado */}
          <div className="relative w-36 h-36 md:w-44 md:h-44 mb-6 rounded-3xl flex items-center justify-center overflow-hidden hover:scale-105 transition-all duration-500 shadow-[0_0_60px_rgba(251,191,36,0.3)] bg-black/40 border border-primary/20">
            <Image
              src="/assets/logo_oficial.png"
              alt="MundiAPP26 Logo"
              fill
              sizes="(max-width: 768px) 144px, 176px"
              className="object-contain p-3"
              priority
            />
            {/* Resplandor dorado radial detrás */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.2)_0%,transparent_70%)] pointer-events-none -z-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-6 animate-bounce">
              <Zap className="w-3 h-3 fill-current" />
              Experiencia de Siguiente Generación
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
              DOMINA EL <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-gradient">EVENTO GLOBAL 2026</span>
          </h1>

          <p className="text-white/50 text-sm md:text-lg max-w-2xl font-medium leading-relaxed mb-8">
              La plataforma de pronósticos más avanzada para el Mundial de Norteamérica.
              Generá tu Liga, desafía a tus amigos y viví toda la competencia con datos en tiempo real y una interfaz diseñada para la victoria en MundiApp26.
          </p>

          <Suspense fallback={<LandingHeroActionsFallback />}>
            <LandingHeroActions />
          </Suspense>

          {/* --- REUBICACIÓN DEL DISCLAIMER DE FAIR PLAY MEJORADO --- */}
          <div className="mt-16 p-6 bg-gradient-to-r from-black/90 via-primary/10 to-black/90 border-2 border-primary/45 rounded-2xl max-w-2xl mx-auto relative overflow-hidden backdrop-blur-sm shadow-[0_0_35px_rgba(251,191,36,0.12)]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="text-center mb-4">
              <span className="text-primary font-black uppercase tracking-[0.2em] text-xs md:text-sm block mb-1">⚠️ AVISO DE FAIR PLAY</span>
            </div>
            <p className="text-white text-sm md:text-base leading-relaxed text-center font-medium mb-3">
              MundiApp26 se pensó para jugar entre amigos, NO INCLUYE apuestas con dinero real.
            </p>
            <p className="text-white text-sm md:text-base leading-relaxed text-center font-medium mb-3">
              Si en La Liga deciden apostar un fernet o ver quién NO paga el asado, corre por cuenta del grupo de amigos.
            </p>
            <p className="text-white text-sm md:text-base leading-relaxed text-center font-medium">
              Nosotros ponemos la tecnología !
            </p>
          </div>
        </div>

      </section>

      {/* --- MOBILE SORTEO BANNER — solo visible en celular (md:hidden) --- */}
      <a
        href="#sorteo"
        className="md:hidden flex items-center justify-between mx-4 mb-6 px-5 py-3 rounded-2xl border border-[#74b9ff]/30 bg-[#74b9ff]/8 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🇦🇷</span>
          <span className="text-[#74b9ff] text-[11px] font-black uppercase tracking-[0.2em]">¡Hay Sorteo!</span>
        </div>
        <svg className="w-4 h-4 text-[#74b9ff] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </a>

      {/* --- SECCIÓN UNIFICADA: ¿CÓMO SE JUEGA EN MundiAPP26? --- */}
      <section id="features" className="px-6 py-10 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h4 className="text-xs md:text-sm font-black tracking-[0.25em] text-primary uppercase mb-2">La Arena de Pronósticos</h4>
          <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none mb-3">
            ¿CÓMO JUGAR?
          </h3>
          <p className="text-white/60 text-base md:text-lg leading-relaxed font-medium">
            Nada de "Very Dificult !" Entrar a la acción en <strong className="text-primary font-bold">MundiAPP26</strong> es simple, rápido y automático. Olvidate de planillas manuales y disfrutá de la competencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Founder Pass VIP */}
          <div className="md:col-span-6 relative group overflow-hidden bg-gradient-to-r from-[#0a0a0a] via-[#1c180f] to-[#0a0a0a] border border-primary/25 rounded-[32px] p-6 flex flex-col justify-start gap-3 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.02)_0%,transparent_70%)] pointer-events-none" />
            <div className="flex justify-between items-center">
              <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">"EL CAPITAN y sus Amigos"</h4>
              <div className="w-9 h-9 relative flex items-center justify-center flex-shrink-0 bg-primary/10 rounded-xl overflow-hidden group-hover:scale-110 transition-transform">
                <Image
                  src="/assets/logo_oficial.png"
                  alt="MundiAPP26 Icon"
                  width={24}
                  height={24}
                  className="object-contain h-auto"
                />
              </div>
            </div>
            <p className="text-white/75 text-sm md:text-base leading-relaxed">
              Te registras, comprás tu pase y de una te convertís en Capitán. Armas tu Liga privada con nombre propio. Adentro, generás el link de invitación y se los tiras al Whastapp o Telegram y sumás a tus amigos. Suscripción por persona: <strong className="text-primary font-bold">$5.000 ARS</strong> para jugar en TODO el Mundial!!
            </p>
          </div>

          {/* Card 2: Data en Tiempo Real (API-Football) */}
          <div className="md:col-span-6 relative group overflow-hidden bg-gradient-to-r from-[#0a0a0a] via-[#1c180f] to-[#0a0a0a] border border-primary/25 rounded-[32px] p-6 flex flex-col justify-start gap-3 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.02)_0%,transparent_70%)] pointer-events-none" />
            <div className="flex justify-between items-center">
              <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">DATA EN TIEMPO REAL — CHAU PLANILLAS</h4>
              <div className="w-9 h-9 relative flex items-center justify-center flex-shrink-0 bg-primary/10 rounded-xl overflow-hidden group-hover:scale-110 transition-transform">
                <Image
                  src="/assets/logo_oficial.png"
                  alt="MundiAPP26 Icon"
                  width={24}
                  height={24}
                  className="object-contain h-auto"
                />
              </div>
            </div>
            <p className="text-white/75 text-sm md:text-base leading-relaxed">
              Conectado a <strong className="text-white font-bold">API-Football</strong>. Nada de actualizar a mano: los marcadores de la copa, puntos de los jugadores y la tabla de posiciones de tu liga se recalculan automáticamente al finalizar cada partido.
            </p>
          </div>

          {/* Card 3: El Oráculo Sella el Destino */}
          <div className="md:col-span-6 relative group overflow-hidden bg-gradient-to-r from-[#0a0a0a] via-[#1c180f] to-[#0a0a0a] border border-primary/25 rounded-[32px] p-6 flex flex-col justify-start gap-3 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.02)_0%,transparent_70%)] pointer-events-none" />
            <div className="flex justify-between items-center">
              <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">EL ORÁCULO SELLA EL DESTINO</h4>
              <div className="w-9 h-9 relative flex items-center justify-center flex-shrink-0 bg-primary/10 rounded-xl overflow-hidden group-hover:scale-110 transition-transform">
                <Image
                  src="/assets/logo_oficial.png"
                  alt="MundiAPP26 Icon"
                  width={24}
                  height={24}
                  className="object-contain h-auto"
                />
              </div>
            </div>
            <p className="text-white/75 text-sm md:text-base leading-relaxed">
              Cargás tus pronósticos antes de que empiece cada partido. Pensalo bien: una vez que confirmás, la jugada queda <strong className="text-white font-bold">SELLADA</strong> por el Oráculo. No hay cambios a último minuto.
            </p>
          </div>

          {/* Card 4: El Coliseo de Duelos */}
          <div className="md:col-span-6 relative group overflow-hidden bg-gradient-to-r from-[#0a0a0a] via-[#1c180f] to-[#0a0a0a] border border-primary/25 rounded-[32px] p-6 flex flex-col justify-start gap-3 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.02)_0%,transparent_70%)] pointer-events-none" />
            <div className="flex justify-between items-center">
              <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">EL COLISEO DE DUELOS</h4>
              <div className="w-9 h-9 relative flex items-center justify-center flex-shrink-0 bg-primary/10 rounded-xl overflow-hidden group-hover:scale-110 transition-transform">
                <Image
                  src="/assets/logo_oficial.png"
                  alt="MundiAPP26 Icon"
                  width={24}
                  height={24}
                  className="object-contain h-auto"
                />
              </div>
            </div>
            <p className="text-white/75 text-sm md:text-base leading-relaxed">
              Armas desafíos entre los jugadores de La Liga a Duelos por el resultado en los partidos de la fecha. Los ganadores suman Medallas para "agrandarse" en su perfil... ( y cargar al perdedor en el Chat ! )
            </p>
          </div>
        </div>
      </section>

      {/* --- SORTEO CAMISETA ARGENTINA --- */}
      <section id="sorteo" className="px-6 py-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card A: Imagen (placeholder para futura imagen) */}
          <div className="relative group overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#1a2744] to-[#0a0f1e] flex items-center justify-center min-h-[320px] hover:border-white/20 transition-all duration-500">
            {/* Fondo decorativo celeste/azul argentina */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(116,185,255,0.08)_0%,transparent_70%)]" />
            <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-[#74b9ff]/40" />
            <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-[#74b9ff]/20" />

            {/* Placeholder visual / Imagen Oficial */}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center p-8 w-full h-full justify-center">
              <div className="relative w-56 h-56 md:w-72 md:h-72 drop-shadow-[0_0_40px_rgba(116,185,255,0.4)] hover:scale-110 hover:rotate-2 transition-all duration-500">
                {/* Asegúrate de colocar la imagen generada en public/assets/camiseta.png */}
                <Image 
                  src="/assets/camiseta.png" 
                  alt="Camiseta Oficial Argentina"
                  fill
                  sizes="(max-width: 768px) 224px, 288px"
                  className="object-contain drop-shadow-2xl scale-110"
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
              que se registren en la App para formar su Liga con al menos dos invitados, sortearemos una{" "}
              <strong className="text-white">Camiseta Oficial de Argentina</strong>.
            </p>

            {/* CTA texto final */}
            <p className="text-primary font-black uppercase tracking-[0.15em] text-sm">
              ¡Sé uno de los 50!
            </p>
            <p className="text-primary font-black uppercase tracking-[0.15em] text-sm">
              ¡A ganarla! 🏆
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

      {/* --- CTA SECTION --- */}
      <section className="relative px-6 py-10 max-w-5xl mx-auto text-center overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none mb-6">
          ¿LISTO PARA JUGAR?
        </h2>
        <p className="text-white/65 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
          El Mundial te espera. Registrate, armá tu Liga e invitá a tus amigos
        </p>
        <p className="text-white/65 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
          <strong className="text-white">¡Que empiece la competencia!</strong> 🏆⚽
        </p>

        <Link href="/login?mode=register" className="inline-flex px-10 py-5 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:scale-105 hover:-translate-y-[2px] transition-all duration-300 group mx-auto justify-center w-fit">
            Armar mi Liga Ahora
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* --- FOOTER --- */}
      <footer className="w-full border-t border-white/5 py-8 px-6 text-center">
        <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.5em] mb-4">
          Designed by <span className="text-primary">JG/GM - TheGame</span>
        </p>
        <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.5em] mb-4">
          Powered by <span className="text-primary">Antigravity Engine</span>
        </p>
        <div className="flex justify-center gap-8 mb-6">
            <Link href="/terms" className="text-[9px] uppercase font-bold text-white/40 hover:text-white transition-colors">Términos</Link>
            <Link href="/privacy" className="text-[9px] uppercase font-bold text-white/40 hover:text-white transition-colors">Privacidad</Link>
            <Link href="/support" className="text-[9px] uppercase font-bold text-white/40 hover:text-white transition-colors">Soporte</Link>
        </div>
        <p className="text-[8px] text-white/20 uppercase font-medium tracking-widest">
          © 2026 -  MundiAPP26 - LIGAS — Todos los derechos reservados.
        </p>
      </footer>

      </div>
    </LandingWrapper>
  );
}
