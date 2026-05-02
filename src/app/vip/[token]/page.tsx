import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TicketClient from "./TicketClient";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  // WhatsApp y Telegram leerán esta metadata para "enmascarar" el link
  return {
    title: 'PASE VIP - Fixture Mundial 2026',
    description: 'Entrada oficial de un solo uso. Haz clic para redimir tu acceso y fundar tu Arena Privada.',
    openGraph: {
      title: '🎟️ LICENCIA DE CAPITÁN - Mundial 2026',
      description: 'Acceso seguro y exclusivo. Toca aquí para ver tu entrada digital.',
      images: ['/logo.svg'], 
    },
  };
}

export default async function VIPTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  // Validar si el token es real y no ha sido usado
  const { data: tokenData, error } = await supabase
    .from('access_tokens')
    .select('*')
    .eq('token', resolvedParams.token)
    .maybeSingle();

  if (error || !tokenData) {
    return <InvalidTicket message="El pase no existe o la URL es incorrecta." />;
  }

  if (tokenData.is_used) {
    return <InvalidTicket message="Este pase VIP ya fue canjeado por otro gladiador." />;
  }

  return <TicketClient token={resolvedParams.token} />;
}

function InvalidTicket({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-3xl text-center max-w-sm shadow-[0_0_40px_rgba(239,68,68,0.1)]">
        <h1 className="text-red-500 font-black text-2xl mb-3 tracking-tighter uppercase">ACCESO DENEGADO</h1>
        <p className="text-white/60 text-sm font-medium leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
