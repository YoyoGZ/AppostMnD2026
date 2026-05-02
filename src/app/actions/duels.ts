"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import worldCupData from "@/data/world-cup-2026.json";

/**
 * Crea un duelo en una liga específica.
 */
export async function createDuelAction(leagueId: string, matchId: string, participantIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: duel, error: createError } = await supabase
    .from('league_duels')
    .insert({
      league_id: leagueId,
      match_id: matchId,
      created_by: user.id,
      status: 'active'
    })
    .select('id')
    .single();

  if (createError) return { error: "No se pudo forjar el duelo." };

  const participantsData = participantIds.map(uid => ({
    duel_id: duel.id,
    user_id: uid,
    is_winner: false
  }));

  const { error: partsError } = await supabase
    .from('duel_participants')
    .insert(participantsData);

  if (partsError) return { error: "No se pudieron inscribir los gladiadores." };

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Obtiene los duelos de una liga con sus participantes y nombres de gladiadores.
 */
export async function getLeagueDuelsAction(leagueId: string) {
  const supabase = await createClient();

  const { data: duels, error: duelsError } = await supabase
    .from('league_duels')
    .select(`
      id,
      match_id,
      status,
      created_at,
      duel_participants (
        user_id,
        is_winner
      )
    `)
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false });

  if (duelsError) return { error: duelsError.message };

  // 1. Mapeo de Equipos (ID -> Nombre)
  const teamMap = new Map(worldCupData.equipos.map((t: any) => [t.id, t.nombre]));
  
  // 2. Mapeo de Partidos (ID -> "Local vs Visitante")
  const matchMap = new Map(worldCupData.partidos.map((m: any) => {
    const localName = teamMap.get(m.local) || m.local;
    const visitorName = teamMap.get(m.visitante) || m.visitante;
    return [m.id.toString(), `${localName} vs ${visitorName}`];
  }));

  const userIds = Array.from(new Set(duels.flatMap(d => d.duel_participants.map((p: any) => p.user_id))));
  const { data: profiles } = await supabase
    .from('league_members')
    .select('user_id, alias')
    .in('user_id', userIds);

  const aliasMap = new Map(profiles?.map(p => [p.user_id, p.alias]));

  const formattedDuels = (duels || []).map(d => ({
    id: d.id,
    matchId: d.match_id,
    matchName: matchMap.get(d.match_id.toString()) || `Partido #${d.match_id}`,
    status: d.status,
    createdAt: d.created_at,
    participants: d.duel_participants.map((p: any) => ({
      userId: p.user_id,
      isWinner: p.is_winner,
      alias: aliasMap.get(p.user_id) || "Gladiador"
    }))
  }));

  return { success: true, duels: formattedDuels };
}

/**
 * Archiva todos los duelos terminados de una liga. Solo el Capitán puede hacerlo.
 */
export async function archiveDuelsAction(leagueId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: league } = await supabase
    .from('leagues')
    .select('created_by')
    .eq('id', leagueId)
    .single();

  if (!league || league.created_by !== user.id) {
    return { error: "Solo el Capitán puede limpiar la arena." };
  }

  const { error } = await supabase
    .from('league_duels')
    .update({ status: 'archived' })
    .eq('league_id', leagueId)
    .eq('status', 'resolved');

  if (error) return { error: "No se pudo limpiar la arena." };

  revalidatePath('/dashboard');
  return { success: true };
}
