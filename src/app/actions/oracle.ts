"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import worldCupData from "@/data/world-cup-2026.json";
import knockoutData from "@/data/knockouts-simulation.json";
import { calculatePoints } from "@/lib/utils/oracle";

/**
 * Oráculo: Sincroniza puntos y duelos para una liga específica.
 * Versión: Aislada (Fuente de Verdad: JSON)
 */
export async function processFinishedMatches(leagueId?: string) {
  try {
    // Usamos el cliente admin para evitar fallos de RLS silenciosos (Lección LT-2)
    const supabase = createAdminClient();

    // 1. Partidos finalizados (Combinamos Grupos + Eliminatorias)
    const groupMatches = worldCupData.partidos.filter((m: any) => m.estado === "finalizado");
    const knockoutMatches = knockoutData.rondas.flatMap(r => r.partidos).filter((m: any) => m.estado === "finalizado");
    
    const finishedMatches = [...groupMatches, ...knockoutMatches];

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
    let membersQuery = supabase.from('league_members').select('id, user_id, league_id, alias');
    if (leagueId) {
      membersQuery = membersQuery.eq('league_id', leagueId);
    }
    const { data: members, error: membersError } = await membersQuery;
    
    if (membersError) throw membersError;
    if (!members || members.length === 0) return { success: true, message: "No hay miembros que procesar." };

    // 4. Resolver Duelos Activos (BULK-ish)
    let duelQuery = supabase.from('league_duels').select('id, match_id, league_id').eq('status', 'active');
    if (leagueId) {
      duelQuery = duelQuery.eq('league_id', leagueId);
    }
    const { data: allActiveDuels, error: duelsError } = await duelQuery;

    if (duelsError) throw duelsError;

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
        id: member.id,
        user_id: member.user_id,
        league_id: member.league_id,
        alias: member.alias, // Incluimos el alias para cumplir con la restricción NOT NULL
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

    // 6. --- AVANCE DE LLAVES (KNOCKOUT PROGRESSION) ---
    const knockoutFinalized = knockoutMatches.filter(m => (m as any).path);
    console.log(`[Oráculo] Procesando ${knockoutFinalized.length} partidos knockout finalizados...`);
    
    if (knockoutFinalized.length > 0) {
      const advancementUpdates: any[] = [];

      for (const match of knockoutFinalized) {
        const path = (match as any).path;
        console.log(`[Oráculo] Evaluando avance para partido ${match.id}. Path:`, path);

        // Determinar ganador
        let winnerId = null;
        if (match.goles_local > match.goles_visitante) {
          winnerId = match.equipo_local;
        } else if (match.goles_visitante > match.goles_local) {
          winnerId = match.equipo_visitante;
        } else {
          winnerId = match.winner_id_manual || match.equipo_local; 
        }

        if (winnerId) {
          // Forzar RSA sobre ZA (FIFA Standard)
          const finalWinnerId = winnerId === 'ZA' ? 'RSA' : winnerId;
          
          console.log(`[Oráculo] Ganador detectado: ${finalWinnerId}. Promoviendo a ${path.next_match}`);
          advancementUpdates.push({
            id: path.next_match,
            home_team_id: path.next_pos === 'home' ? finalWinnerId : undefined,
            away_team_id: path.next_pos === 'away' ? finalWinnerId : undefined,
            status: 'pending',
            last_sync: new Date().toISOString()
          });
        }
      }

      if (advancementUpdates.length > 0) {
        console.log(`[Oráculo] Enviando ${advancementUpdates.length} actualizaciones a match_results:`, advancementUpdates);
        const { error: advError } = await supabase.from('match_results').upsert(advancementUpdates);
        if (advError) {
          console.error("[Oráculo] Error en avance de llaves:", advError);
        } else {
          console.log("[Oráculo] Avance de llaves persistido con éxito.");
        }
      }
    }

    return { success: true, message: "Auditoría de Arena y Avance de Llaves completados." };

  } catch (error: any) {
    console.error("[Oráculo] Error:", error);
    return { success: false, message: error.message };
  }
}
