import { createClient } from "@/utils/supabase/server";
import { processFinishedMatches } from "@/app/actions/oracle";
import StandingsClient from "@/components/tournament/StandingsClient";
import { redirect } from "next/navigation";
import { getLeagueDuelsAction } from "@/app/actions/duels";

// Forzamos que esta ruta sea dinámica para que no la cachee y siempre traiga los puntos frescos
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // 1. Validación Pasiva: Ejecutar de forma transparente el Oráculo si se detectan predicciones pendientes de puntuar
  try {
    const { data: finishedMatches } = await supabase
      .from('match_results')
      .select('id')
      .eq('status', 'finished');

    const finishedIds = finishedMatches?.map(m => m.id) || [];
    if (finishedIds.length > 0) {
      const { data: pendingPreds } = await supabase
        .from('predictions')
        .select('id')
        .in('match_id', finishedIds)
        .is('points_earned', null)
        .limit(1);

      if (pendingPreds && pendingPreds.length > 0) {
        console.log(`[Standings Server Page] 🔔 Detectadas predicciones de partidos finalizados sin evaluar. Forzando ejecución del Oráculo de forma pasiva...`);
        await processFinishedMatches();
      }
    }
  } catch (oracleErr) {
    console.error("❌ [Standings Server Page] Error al validar o ejecutar el Oráculo de forma pasiva:", oracleErr);
  }

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
    redirect("/login?mode=register");
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
    redirect("/login?mode=register");
  }

  const leagueData: any = data[0].leagues;
  const actualLeague = Array.isArray(leagueData) ? leagueData[0] : leagueData;

  const leagueInfo = actualLeague ? {
    id: actualLeague.id,
    name: actualLeague.name,
    inviteCode: actualLeague.invite_code,
    isAdmin: actualLeague.created_by === user.id
  } : undefined;

  const mapped = (data || []).map((d: any) => ({
    id: d.user_id,
    alias: d.alias,
    pts: d.total_pts || 0,
    plenos: d.plenos_exactos || 0,
    simples: d.aciertos_simples || 0,
    duelosGanados: d.duelos_ganados || 0,
    racha: d.racha || [],
    form: (d.racha || []).includes("W") ? "hot" : "ice"
  }));

  // 3. Traer los duelos activos de esta liga
  const duelsResult = await getLeagueDuelsAction(activeLeagueId);
  const duels = duelsResult.success ? duelsResult.duels : [];

  return <StandingsClient leaderboard={mapped} leagueInfo={leagueInfo} initialDuels={duels} />;
}
