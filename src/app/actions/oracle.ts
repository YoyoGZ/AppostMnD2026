"use server";

import { createClient } from "@/utils/supabase/server";
import worldCupData from "@/data/world-cup-2026.json";
import { calculatePoints } from "@/lib/utils/oracle";

/**
 * Función que busca partidos finalizados en el JSON, y actualiza los puntos
 * en la base de datos de Supabase para todas las predicciones de los usuarios.
 */
export async function processFinishedMatches() {
  try {
    const supabase = await createClient();

    // 1. Encontrar todos los partidos finalizados en el JSON
    const finishedMatches = worldCupData.partidos.filter((m: any) => m.estado === "finalizado");

    if (finishedMatches.length === 0) {
      return { success: true, message: "No hay partidos finalizados." };
    }

    const finishedMatchIds = finishedMatches.map((m: any) => m.id.toString());
    
    // 2. Traer todas las predicciones sin procesar (points_earned = NULL)
    const { data: pendingPredictions, error } = await supabase
      .from('predictions')
      .select('*')
      .in('match_id', finishedMatchIds);

    if (error) throw error;
    if (pendingPredictions && pendingPredictions.length > 0) {
      console.log(`[Oráculo] Procesando ${pendingPredictions.length} boletos pendientes...`);
      for (const pred of pendingPredictions) {
        const match = finishedMatches.find((m: any) => m.id.toString() === pred.match_id.toString());
        if (!match) continue;

        if (typeof match.goles_local !== 'number' || typeof match.goles_visitante !== 'number') {
          continue;
        }

        const { puntos } = calculatePoints(
          pred.equipo_a_goles,
          pred.equipo_b_goles,
          match.goles_local,
          match.goles_visitante
        );

        // Actualizar la predicción
        await supabase
          .from('predictions')
          .update({ points_earned: puntos })
          .eq('id', pred.id);
      }
    }

    // 4. Recalcular tabla de posiciones TOTAL
    const { data: members, error: membersError } = await supabase
      .from('league_members')
      .select('user_id');

    if (membersError) throw membersError;

    if (members) {
      for (const member of members) {
        const userId = member.user_id;
        const { data: userPreds } = await supabase
          .from('predictions')
          .select('points_earned')
          .eq('user_id', userId)
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
            .eq('user_id', userId);
        }
      }
    }

    // 5. Resolver Duelos Activos
    let duelLog = `Partidos: [${finishedMatchIds.join(',')}]... `;
    
    const { data: allActiveDuels, error: duelsError } = await supabase
      .from('league_duels')
      .select('id, match_id')
      .eq('status', 'active');

    if (duelsError) {
      duelLog += `Error DB: ${duelsError.message}. `;
    } else {
      duelLog += `Duelos activos: ${allActiveDuels?.length || 0}. `;
    }

    const activeDuels = (allActiveDuels || []).filter(duel => 
      finishedMatchIds.includes(duel.match_id?.toString())
    );

    duelLog += `Match: ${activeDuels.length}. `;

    for (const duel of activeDuels) {
      duelLog += `[Duelo ${duel.id.substring(0,4)}: `;
      
      const { data: participants, error: pError } = await supabase
        .from('duel_participants')
        .select('user_id')
        .eq('duel_id', duel.id);
        
      if (pError || !participants || participants.length === 0) {
        duelLog += `Sin participantes]. `;
        continue;
      }

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
        duelLog += `${winners.length} ganadores]. `;
      } else {
        duelLog += `Empate/Cero]. `;
      }
      
      // Marcar duelo como resuelto
      await supabase
        .from('league_duels')
        .update({ status: 'resolved' })
        .eq('id', duel.id);
    }

    return { 
      success: true, 
      message: `INFORME: ${duelLog}` 
    };

  } catch (error: any) {
    console.error("[Oráculo] Error fatal:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
}
