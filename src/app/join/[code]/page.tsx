import { getLeagueByInvite } from "@/app/actions/leagues";
import { createClient } from "@/utils/supabase/server";
import { JoinClient } from "./JoinClient";
import { Shield, AlertTriangle, ArrowRight } from "lucide-react";
import Image from "next/image";

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props) {
  try {
    const { code } = await params;
    const leagueResult = await getLeagueByInvite(code);

    if (!leagueResult || "error" in leagueResult) {
      return {
        title: "Invitación de Liga - MundiApp26 🏆",
        description: "Unite a las ligas de MundiApp26 y competí amigos en este Mundial.",
      };
    }

    const title = `¡Te invitaron a la Liga "${leagueResult.name}"! 🏆`;
    const description = `Unite a la Liga creada por ${leagueResult.captainAlias} en MundiApp26. Pronosticá los partidos y desafiá a tus amigos en los Duelos. ¡Aceptá el desafío!`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://mundiapp26.com/join/${code}`,
        siteName: "MundiApp26",
        images: [
          {
            url: "https://mundiapp26.com/assets/logo_oficial.png",
            width: 512,
            height: 512,
            alt: "MundiApp26 Logo",
          },
        ],
        locale: "es_AR",
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: ["https://mundiapp26.com/assets/logo_oficial.png"],
      }
    };
  } catch (err) {
    return {
      title: "Invitación de Liga - MundiApp26 🏆",
      description: "Unite a las ligas de MundiApp26 y competí con tus amigos en la Copa del Mundo.",
    };
  }
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params;

  // Resolver la liga por el código del path (funciona para anon gracias al RLS fix)
  const leagueResult = await getLeagueByInvite(code);

  // Link inválido o liga no encontrada → Mostrar pantalla de error premium recuperable (UX de alta fidelidad)
  if (!leagueResult || "error" in leagueResult) {
    return (
      <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background overflow-y-auto px-4 py-8">
        {/* Fondo inmersivo */}
        <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-red-500/10 via-background to-transparent -z-10" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-red-500/10 rounded-full blur-[100px] -z-10 pointer-events-none opacity-40" />

        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-red-500/20 p-8 rounded-2xl text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500/50 via-red-500 to-red-500/50" />
          
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <AlertTriangle className="w-8 h-8 text-red-500 drop-shadow-md" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-3">
            Liga No Encontrada
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed font-semibold">
            El enlace de invitación que ingresaste es inválido, ha expirado o pertenece a una arena inexistente en MundiApp26.
          </p>

          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6 text-left">
            <p className="text-white/60 text-[11px] leading-relaxed font-medium">
              💡 <span className="text-white font-bold">¿Qué pudo pasar?</span> El código de invitación <strong className="text-red-400 font-bold">"{code}"</strong> puede tener un error tipográfico o el creador de la liga dio de baja la arena.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Crear mi propia Liga <ArrowRight className="w-4 h-4" />
            </a>
            
            <a
              href="/"
              className="text-white/40 hover:text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors py-2"
            >
              Volver a la Página Principal
            </a>
          </div>
        </div>
      </div>
    );
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
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-between bg-background overflow-y-auto">
      {/* Fondo inmersivo y sutil con colores corporativos */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-primary/10 via-background to-transparent -z-10" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-primary/20 rounded-full blur-[140px] -z-10 pointer-events-none opacity-40" />

      {/* Margen para que no quede pegado en desktop y use scroll en móviles */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-8 sm:py-12 md:py-16">
        {/* Cabecera general con el Logotipo Oficial */}
        <header className="mb-8 text-center flex flex-col items-center w-full max-w-5xl">
          <div className="w-20 h-20 sm:w-24 sm:h-24 relative mb-4 drop-shadow-[0_0_25px_rgba(251,191,36,0.25)] hover:scale-105 transition-transform duration-300">
            <Image
              src="/assets/logo_oficial.png"
              alt="MundiApp26 Logo Oficial"
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_15px_rgba(251,191,36,0.15)] leading-tight max-w-2xl">
            ¡Te invitaron a unirte a la Liga de tu amigo/a:  <span className="text-primary">"{leagueResult.captainAlias}"</span> !
          </h1>
          
          <p className="text-white/60 text-xs sm:text-sm font-semibold leading-relaxed mt-3 max-w-xl">
            Bienvenido a MundiApp26! <strong className="text-primary font-black">La App para el Mundial!</strong>.
          </p>
          <p className="text-white/60 text-xs sm:text-sm font-semibold leading-relaxed mt-3 max-w-xl">
            Para jugar: Te registras, te llevamos al Pago Seguro de Mercado Pago, pagas tu suscripción de <strong className="text-primary font-black">$5.000 ARS </strong> y directo a la App !!
          </p>
        </header>

        {/* Bento Grid Principal — Delegado al Client Component para máxima interactividad */}
        <main className="w-full max-w-5xl relative z-10 flex justify-center">
          <JoinClient
            code={code}
            leagueInfo={leagueResult}
            isAuthenticated={!!user}
            userAlias={userAlias}
          />
        </main>
      </div>

      <footer className="w-full text-center py-6 opacity-30 hover:opacity-60 transition-opacity shrink-0">
        <p className="text-[10px] uppercase font-bold tracking-widest text-white">
          Designed by GM/JG - THE GAME
        </p>
        <p className="text-[10px] uppercase font-bold tracking-widest text-white">
          Powered by ANTIGRAVITY ENGINE
        </p>
      </footer>
    </div>
  );
}

