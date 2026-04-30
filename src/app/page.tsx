import React from "react";
import { LoginShield } from "@/components/auth/LoginShield";
import { DynamicQR } from "@/components/auth/DynamicQR";
import { Shield } from "lucide-react";
import { getLeagueByInvite } from "@/app/actions/leagues";

/**
 * Página de Login (Landing).
 * Renderiza SIN Shell/Sidebar — layout completamente independiente.
 * El middleware redirige aquí si no hay sesión, y redirige a /dashboard si la hay.
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
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background overflow-y-auto">
      {/* Fondo inmersivo: gradiente + glow central */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50" />

      {/* Contenido principal: anclado al centro con padding seguro para mobile */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-4 py-12 sm:py-16">
        <header className="mb-2 text-center flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary drop-shadow-md" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-widest text-primary uppercase drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
            {inviteCode ? "¡Has sido reclutado!" : "Torneo de Apuestas Amistoso"}
          </h2>
          <p className="text-white/40 text-[10px] sm:text-xs font-medium uppercase tracking-[0.3em] mt-2">
            {inviteCode ? "Ingresa para unirte a la Arena" : "Ingreso Restringido"}
          </p>
        </header>

        {/* Auth UI */}
        <main className="w-full relative z-10 flex flex-col items-center">
          <LoginShield inviteCode={inviteCode} leagueInfo={leagueInfo} />
          <DynamicQR />
        </main>
      </div>

      {/* Footer minimalista: anclado al fondo */}
      <footer className="w-full text-center py-4 opacity-40 hover:opacity-100 transition-opacity shrink-0">
        <p className="text-[10px] uppercase font-bold tracking-widest">
          Copa del Mundo FIFA 2026
        </p>
      </footer>
    </div>
  );
}
