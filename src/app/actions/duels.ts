"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Crea un nuevo duelo en la base de datos. Solo el Capitán puede invocarlo.
 */
export async function createDuelAction(leagueId: string, matchId: string, participantIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  if (participantIds.length < 2) {
    return { error: "Un duelo requiere al menos 2 gladiadores." };
  }

  // 1. Validar que el usuario sea el Capitán (creador) de la liga
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('created_by')
    .eq('id', leagueId)
    .single();

  if (leagueError || !league || league.created_by !== user.id) {
    return { error: "Solo el Capitán fundador puede organizar duelos en el Coliseo." };
  }

  // 2. Crear el duelo en estado 'active'
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

  if (createError || !duel) {
    console.error("Error creando duelo:", createError);
    return { error: "No se pudo preparar el Ring de duelo." };
  }

  // 3. Insertar a los participantes
  const participantsData = participantIds.map(uid => ({
    duel_id: duel.id,
    user_id: uid,
    is_winner: false
  }));

  const { error: partsError } = await supabase
    .from('duel_participants')
    .insert(participantsData);

  if (partsError) {
    console.error("Error insertando duelistas:", partsError);
    return { error: "Duelo creado pero falló el ingreso de los gladiadores al ring." };
  }

  // Refrescar el Dashboard para que todos vean el nuevo duelo
  revalidatePath('/dashboard');
  return { success: true, duelId: duel.id };
}

/**
 * Obtiene todos los duelos activos e históricos de una liga, incluyendo los alias de los participantes.
 */
export async function getLeagueDuelsAction(leagueId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // 1. Obtener duelos y la lista de sus participantes
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

  if (duelsError) {
    console.error("Error obteniendo duelos:", duelsError);
    return { error: "Error de lectura del Coliseo." };
  }

  // 2. Obtener alias de TODOS los miembros de esta liga
  const { data: members, error: membersError } = await supabase
    .from('league_members')
    .select('user_id, alias')
    .eq('league_id', leagueId);

  if (membersError) {
    console.error("Error obteniendo miembros:", membersError);
    return { error: "Error identificando gladiadores." };
  }

  // 3. Crear mapa de alias para lookup O(1)
  const aliasMap = new Map(members?.map(m => [m.user_id, m.alias]));

  // 4. Mapear y combinar los datos para que el Frontend los consuma fácilmente
  const formattedDuels = duels.map(d => ({
    id: d.id,
    matchId: d.match_id,
    status: d.status,
    createdAt: d.created_at,
    participants: d.duel_participants.map((p: any) => ({
      userId: p.user_id,
      isWinner: p.is_winner,
      alias: aliasMap.get(p.user_id) || "Gladiador Misterioso"
    }))
  }));

  return { success: true, duels: formattedDuels };
}
