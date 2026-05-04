"use server";

import { createClient } from "@/utils/supabase/server";
import worldCupData from "@/data/world-cup-2026.json";
import { calculatePoints } from "@/lib/utils/oracle";

/**
 * Oráculo: Sincroniza puntos y duelos para una liga específica.
 */
export async function processFinishedMatches(leagueId?: string) {
  try {
    const supabase = await createClient();

    // 1. Partidos finalizados en el JSON
    const finishedMatches = worldCupData.partidos.filter((m: any) => m.estado === "finalizado");
    if (finishedMatches.length === 0) {
      return { success: true, message: "No hay partidos finalizados." };
    }
    const finishedMatchIds = finishedMatches.map((m: any) => m.id.toString());
    
    // 2. Actualizar Puntos de Predicciones
    const { data: pendingPredictions } = await supabase
      .from('predictions')
      .select('*')
      .in('match_id', finishedMatchIds);

    if (pendingPredictions && pendingPredictions.length > 0) {
      for (const pred of pendingPredictions) {
        const match = finishedMatches.find((m: any) => m.id.toString() === pred.match_id.toString());
        if (!match || typeof match.goles_local !== 'number') continue;
        const { puntos } = calculatePoints(pred.equipo_a_goles, pred.equipo_b_goles, match.goles_local, match.goles_visitante);
        await supabase.from('predictions').update({ points_earned: puntos }).eq('id', pred.id);
      }
    }

    // 3. Obtener solo los miembros de la liga que estamos auditando
    let query = supabase.from('league_members').select('user_id, league_id');
    if (leagueId) {
      query = query.eq('league_id', leagueId);
    }
    const { data: members } = await query;
    if (!members || members.length === 0) return { success: true, message: "No hay miembros que procesar." };

    // 4. Resolver Duelos Activos de esta liga
    let duelQuery = supabase.from('league_duels').select('id, match_id, league_id').eq('status', 'active');
    if (leagueId) {
      duelQuery = duelQuery.eq('league_id', leagueId);
    }
    const { data: allActiveDuels } = await duelQuery;

    const activeDuels = (allActiveDuels || []).filter(duel => 
      finishedMatchIds.includes(duel.match_id?.toString())
    );

    for (const duel of activeDuels) {
      const { data: participants } = await supabase.from('duel_participants').select('user_id').eq('duel_id', duel.id);
      if (!participants || participants.length === 0) continue;

      const userIds = participants.map(p => p.user_id);
      const { data: preds } = await supabase.from('predictions').select('user_id, points_earned').eq('match_id', duel.match_id.toString()).in('user_id', userIds);
      
      let maxPoints = -1;
      const userPoints: Record<string, number> = {};
      userIds.forEach(u => userPoints[u] = 0);
      if (preds) {
        preds.forEach(p => {
          const pts = p.points_earned || 0;
          userPoints[p.user_id] = pts;
          if (pts > maxPoints) maxPoints = pts;
        });
      }

      const winners = userIds.filter(uid => userPoints[uid] === maxPoints && maxPoints > 0);
      if (winners.length > 0) {
        for (const winnerId of winners) {
          await supabase.from('duel_participants').update({ is_winner: true }).eq('duel_id', duel.id).eq('user_id', winnerId);
        }
      }
      await supabase.from('league_duels').update({ status: 'resolved' }).eq('id', duel.id);
    }

    // 5. --- RECALCULO DE MEDALLAS ---
    // FIX (LT-1 Anti-Pattern): El bug anterior hacía N queries individuales por miembro,
    // filtrando por `user_id` de OTROS usuarios. Si el RLS de `duel_participants` usa
    // `user_id = auth.uid()`, esas queries devuelven count: null silenciosamente → 0 victorias.
    //
    // SOLUCIÓN: Un único bulk fetch de todos los ganadores de la liga, agregado en memoria.
    // No filtramos por user_id en la DB — solo por duel_id (que sí tenemos permiso de leer).

    // Obtener todos los duel_ids de esta liga de una vez
    const uniqueLeagueIds = [...new Set(members.map(m => m.league_id))];
    const { data: allLeagueDuels } = await supabase
      .from('league_duels')
      .select('id')
      .in('league_id', uniqueLeagueIds);

    const allLeagueDuelIds = (allLeagueDuels || []).map(d => d.id);

    // Bulk fetch de TODOS los ganadores de la liga (sin filtrar por user_id en DB)
    const victoriesMap = new Map<string, number>();
    if (allLeagueDuelIds.length > 0) {
      const { data: allWinners } = await supabase
        .from('duel_participants')
        .select('user_id')
        .eq('is_winner', true)
        .in('duel_id', allLeagueDuelIds);

      (allWinners || []).forEach(w => {
        victoriesMap.set(w.user_id, (victoriesMap.get(w.user_id) || 0) + 1);
      });
    }

    for (const member of members) {
      // Puntos y Aciertos — query individual pero solo sobre sus propias predicciones (sin conflicto RLS)
      const { data: userPreds } = await supabase
        .from('predictions')
        .select('points_earned')
        .eq('user_id', member.user_id)
        .not('points_earned', 'is', null);

      let totalPts = 0, aciertos = 0, plenos = 0;
      if (userPreds) {
        userPreds.forEach(p => {
          const pts = p.points_earned || 0;
          totalPts += pts;
          if (pts === 5) { plenos++; aciertos++; }
          else if (pts === 2) { aciertos++; }
        });
      }

      // Victorias tomadas del mapa en memoria (no más queries bloqueadas por RLS)
      const victories = victoriesMap.get(member.user_id) || 0;

      const { error: updateError } = await supabase
        .from('league_members')
        .update({
          total_pts: totalPts,
          aciertos_simples: aciertos,
          plenos_exactos: plenos,
          duelos_ganados: victories
        })
        .eq('user_id', member.user_id)
        .eq('league_id', member.league_id);

      if (updateError) {
        console.error(`[Oráculo] Error actualizando medallas de ${member.user_id}:`, updateError.message);
      }
    }

    return { success: true, message: "Auditoría de Arena completada con éxito." };

  } catch (error: any) {
    console.error("[Oráculo] Error:", error);
    return { success: false, message: error.message };
  }
}
