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
  await processFinishedMatches();

  // 1.5 Obtener la liga activa de los metadatos del usuario
  let activeLeagueId = user.user_metadata?.active_league_id;

  // Si no hay liga activa en metadatos, buscamos la primera disponible
  if (!activeLeagueId) {
    const { data: firstMembership } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    
    activeLeagueId = firstMembership?.league_id;
  }

  if (!activeLeagueId) {
    console.log("❌ [STANDINGS] No se encontró liga activa para el usuario.");
    redirect("/onboarding");
  }

  // 2. Traer el Leaderboard fresco SOLO de esta liga
  const { data, error } = await supabase
    .from('league_members')
    .select('*, leagues ( id, name, invite_code, created_by )')
    .eq('league_id', activeLeagueId)
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
