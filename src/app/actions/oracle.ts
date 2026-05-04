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
    
    // 2. Actualizar Puntos de Predicciones (BULK)
    const { data: pendingPredictions } = await supabase
      .from('predictions')
      .select('*')
      .in('match_id', finishedMatchIds);

    if (pendingPredictions && pendingPredictions.length > 0) {
      const predictionUpdates = pendingPredictions.map(pred => {
        const match = finishedMatches.find((m: any) => m.id.toString() === pred.match_id.toString());
        if (!match || typeof match.goles_local !== 'number') return null;
        const { puntos } = calculatePoints(pred.equipo_a_goles, pred.equipo_b_goles, match.goles_local, match.goles_visitante);
        return { id: pred.id, points_earned: puntos };
      }).filter(Boolean);

      if (predictionUpdates.length > 0) {
        await supabase.from('predictions').upsert(predictionUpdates);
      }
    }

    // 3. Obtener miembros
    let query = supabase.from('league_members').select('id, user_id, league_id');
    if (leagueId) query = query.eq('league_id', leagueId);
    const { data: members } = await query;
    if (!members || members.length === 0) return { success: true, message: "No hay miembros que procesar." };

    // 4. Resolver Duelos Activos (BULK-ish)
    let duelQuery = supabase.from('league_duels').select('id, match_id, league_id').eq('status', 'active');
    if (leagueId) duelQuery = duelQuery.eq('league_id', leagueId);
    const { data: allActiveDuels } = await duelQuery;

    const activeDuels = (allActiveDuels || []).filter(duel => finishedMatchIds.includes(duel.match_id?.toString()));

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
        const winnerUpdates = winners.map(winnerId => ({ duel_id: duel.id, user_id: winnerId, is_winner: true }));
        // Upsert de ganadores del duelo
        await supabase.from('duel_participants').upsert(winnerUpdates, { onConflict: 'duel_id,user_id' });
      }
      await supabase.from('league_duels').update({ status: 'resolved' }).eq('id', duel.id);
    }

    // 5. --- RECALCULO DE MEDALLAS (SUPER BULK) ---
    const uniqueLeagueIds = [...new Set(members.map(m => m.league_id))];
    const { data: allLeagueDuels } = await supabase.from('league_duels').select('id').in('league_id', uniqueLeagueIds);
    const allLeagueDuelIds = (allLeagueDuels || []).map(d => d.id);

    const victoriesMap = new Map<string, number>();
    if (allLeagueDuelIds.length > 0) {
      const { data: allWinners } = await supabase.from('duel_participants').select('user_id').eq('is_winner', true).in('duel_id', allLeagueDuelIds);
      (allWinners || []).forEach(w => victoriesMap.set(w.user_id, (victoriesMap.get(w.user_id) || 0) + 1));
    }

    // Obtener TODAS las predicciones de los miembros involucrados de una vez
    const allUserIds = members.map(m => m.user_id);
    const { data: allUserPreds } = await supabase.from('predictions').select('user_id, points_earned').in('user_id', allUserIds).not('points_earned', 'is', null);

    const memberUpdates = members.map(member => {
      const userPreds = (allUserPreds || []).filter(p => p.user_id === member.user_id);
      let totalPts = 0, aciertos = 0, plenos = 0;
      
      userPreds.forEach(p => {
        const pts = p.points_earned || 0;
        totalPts += pts;
        if (pts === 5) { plenos++; aciertos++; }
        else if (pts === 2) { aciertos++; }
      });

      return {
        id: member.id, // Usamos el ID de la tabla league_members para el upsert
        user_id: member.user_id,
        league_id: member.league_id,
        total_pts: totalPts,
        aciertos_simples: aciertos,
        plenos_exactos: plenos,
        duelos_ganados: victoriesMap.get(member.user_id) || 0
      };
    });

    if (memberUpdates.length > 0) {
      const { error: bulkError } = await supabase.from('league_members').upsert(memberUpdates);
      if (bulkError) throw new Error("Error en bulk update de miembros: " + bulkError.message);
    }

    return { success: true, message: "Auditoría de Arena completada con éxito." };

  } catch (error: any) {
    console.error("[Oráculo] Error:", error);
    return { success: false, message: error.message };
  }
}
