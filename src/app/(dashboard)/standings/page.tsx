import { createClient } from "@/utils/supabase/server";
import { processFinishedMatches } from "@/app/actions/oracle";
import StandingsClient from "@/components/tournament/StandingsClient";
import { redirect } from "next/navigation";

// Forzamos que esta ruta sea dinámica para que no la cachee y siempre traiga los puntos frescos
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // 1. Ejecutar el Oráculo (Auditoría de Puntos)
  // Al ser un Server Component, esto se ejecuta SIEMPRE antes de enviar la página al cliente.
  await processFinishedMatches();

  // 1.5 Obtener la liga a la que pertenece el usuario
  const { data: userMembership } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user.id)
    .single();

  if (!userMembership) {
    console.log("❌ [STANDINGS] No se encontró membresía para el usuario.");
    return <div className="p-8 text-white/50 uppercase font-black text-xs tracking-widest text-center">Iniciando Arena...</div>;
  }

  // 2. Traer el Leaderboard fresco SOLO de esta liga
  const { data, error } = await supabase
    .from('league_members')
    .select('*, leagues ( id, name, invite_code, created_by )')
    .eq('league_id', userMembership.league_id)
    .order('total_pts', { ascending: false });

  if (error) {
    console.error("Error cargando leaderboard:", error);
  }

  if (!data || data.length === 0) {
    redirect("/onboarding");
  }

  const leagueData: any = data[0].leagues;
  const actualLeague = Array.isArray(leagueData) ? leagueData[0] : leagueData;

  const leagueInfo = actualLeague ? {
    name: actualLeague.name,
    inviteCode: actualLeague.invite_code,
    isAdmin: actualLeague.created_by === user.id
  } : undefined;

  const mapped = (data || []).map((d: any) => ({
    id: d.id,
    alias: d.alias,
    pts: d.total_pts || 0,
    plenos: d.plenos_exactos || 0,
    simples: d.aciertos_simples || 0,
    racha: d.racha || [],
    form: (d.racha || []).includes("W") ? "hot" : "ice"
  }));

  return <StandingsClient leaderboard={mapped} leagueInfo={leagueInfo} />;
}
