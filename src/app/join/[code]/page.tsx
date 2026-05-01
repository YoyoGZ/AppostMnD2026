import { getLeagueByInvite } from "@/app/actions/leagues";
import { createClient } from "@/utils/supabase/server";
import { JoinClient } from "./JoinClient";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function JoinPage({ params }: Props) {
  const { code } = await params;

  // Resolver la liga por el código del path (funciona para anon gracias al RLS fix)
  const leagueResult = await getLeagueByInvite(code);

  // Link inválido o liga no encontrada → redirigir a home
  if (!leagueResult || "error" in leagueResult) {
    redirect("/");
  }

  // Detectar sesión del usuario actual
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userAlias =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    undefined;

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background overflow-y-auto">
      {/* Fondo inmersivo */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50" />

      <div className="flex flex-col items-center justify-center flex-1 w-full px-4 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary drop-shadow-md" />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-widest text-primary uppercase drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
            ¡Fuiste Reclutado!
          </h1>
          <p className="text-white/40 text-[10px] sm:text-xs font-medium uppercase tracking-[0.3em] mt-2">
            Invitación a una Arena Privada
          </p>
        </header>

        {/* Card principal — delegada al Client Component */}
        <main className="w-full max-w-md relative z-10">
          <JoinClient
            code={code}
            leagueInfo={leagueResult}
            isAuthenticated={!!user}
            userAlias={userAlias}
          />
        </main>
      </div>

      <footer className="w-full text-center py-4 opacity-40 hover:opacity-100 transition-opacity shrink-0">
        <p className="text-[10px] uppercase font-bold tracking-widest">
          Copa del Mundo FIFA 2026
        </p>
      </footer>
    </div>
  );
}
