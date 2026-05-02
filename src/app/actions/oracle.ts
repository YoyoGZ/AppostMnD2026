"use server";

import { createClient } from "@/utils/supabase/server";
import worldCupData from "@/data/world-cup-2026.json";
import { calculatePoints } from "@/lib/utils/oracle";

export async function processFinishedMatches() {
  try {
    const supabase = await createClient();

    // 1. Encontrar partidos finalizados
    const finishedMatches = worldCupData.partidos.filter((m: any) => m.estado === "finalizado");
    if (finishedMatches.length === 0) {
      return { success: true, message: "No hay partidos finalizados." };
    }
    const finishedMatchIds = finishedMatches.map((m: any) => m.id.toString());
    
    // 2. Procesar Predicciones (Puntos)
    const { data: pendingPredictions } = await supabase
      .from('predictions')
      .select('*')
      .in('match_id', finishedMatchIds);

    if (pendingPredictions && pendingPredictions.length > 0) {
      for (const pred of pendingPredictions) {
        const match = finishedMatches.find((m: any) => m.id.toString() === pred.match_id.toString());
        if (!match || typeof match.goles_local !== 'number') continue;

        const { puntos } = calculatePoints(
          pred.equipo_a_goles,
          pred.equipo_b_goles,
          match.goles_local,
          match.goles_visitante
        );

        await supabase
          .from('predictions')
          .update({ points_earned: puntos })
          .eq('id', pred.id);
      }
    }

    // 3. Recalcular Leaderboard (Puntos Totales)
    const { data: members } = await supabase.from('league_members').select('user_id, league_id');
    if (members) {
      for (const member of members) {
        const { data: userPreds } = await supabase
          .from('predictions')
          .select('points_earned')
          .eq('user_id', member.user_id)
          .not('points_earned', 'is', null);

        if (userPreds) {
          let totalPts = 0;
          let aciertos = 0;
          let plenos = 0;

          for (const p of userPreds) {
            const pts = p.points_earned || 0;
            totalPts += pts;
            if (pts === 5) { plenos += 1; aciertos += 1; }
            else if (pts === 2) { aciertos += 1; }
          }

          await supabase
            .from('league_members')
            .update({
              total_pts: totalPts,
              aciertos_simples: aciertos,
              plenos_exactos: plenos
            })
            .eq('user_id', member.user_id)
            .eq('league_id', member.league_id);
        }
      }
    }

    // 4. Resolver Duelos y Autocurar Contador de Victorias
    const { data: allActiveDuels } = await supabase
      .from('league_duels')
      .select('id, match_id, league_id')
      .eq('status', 'active');

    const activeDuels = (allActiveDuels || []).filter(duel => 
      finishedMatchIds.includes(duel.match_id?.toString())
    );

    for (const duel of activeDuels) {
      const { data: participants } = await supabase
        .from('duel_participants')
        .select('user_id')
        .eq('duel_id', duel.id);
        
      if (!participants || participants.length === 0) continue;

      const userIds = participants.map(p => p.user_id);
      const { data: preds } = await supabase
        .from('predictions')
        .select('user_id, points_earned')
        .eq('match_id', duel.match_id.toString())
        .in('user_id', userIds);
        
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
          await supabase
            .from('duel_participants')
            .update({ is_winner: true })
            .eq('duel_id', duel.id)
            .eq('user_id', winnerId);
        }
      }
      
      await supabase
        .from('league_duels')
        .update({ status: 'resolved' })
        .eq('id', duel.id);

      // --- AUTOCURACIÓN DE VICTORIAS ---
      // Para cada gladiador del duelo, contamos cuántos ha ganado en TOTAL en esta liga
      for (const uid of userIds) {
        const { count } = await supabase
          .from('duel_participants')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('is_winner', true)
          // Filtramos solo duelos de esta liga específica
          .in('duel_id', (
             await supabase.from('league_duels').select('id').eq('league_id', duel.league_id)
          ).data?.map(d => d.id) || []);

        await supabase
          .from('league_members')
          .update({ duelos_ganados: count || 0 })
          .eq('user_id', uid)
          .eq('league_id', duel.league_id);
      }
    }

    return { success: true, message: "Sincronización completada con éxito." };

  } catch (error: any) {
    console.error("[Oráculo] Error fatal:", error);
    return { success: false, message: error.message };
  }
}
