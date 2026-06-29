"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import worldCupData from "@/data/world-cup-2026.json";
import knockoutData from "@/data/knockouts-simulation.json";
import { calculatePoints } from "@/lib/utils/oracle";
import { persistMatchResultToLocalJson } from "@/lib/utils/jsonPersist";

/**
 * Oráculo: Sincroniza puntos y duelos para una liga específica.
 * Versión: Aislada (Fuente de Verdad: JSON)
 */
export async function processFinishedMatches(leagueId?: string) {
  try {
    // Usamos el cliente admin para evitar fallos de RLS silenciosos (Lección LT-2)
    const supabase = createAdminClient();

    // 1. Obtener partidos finalizados reales de Supabase
    const { data: dbFinished, error: dbFinishedError } = await supabase
      .from('match_results')
      .select('*')
      .eq('status', 'finished');

    if (dbFinishedError) throw dbFinishedError;
    
    if (!dbFinished || dbFinished.length === 0) {
      return { success: true, message: "No hay partidos finalizados en base de datos." };
    }

    // Persistir de forma definitiva los resultados en el JSON local world-cup-2026.json en desarrollo
    dbFinished.forEach(res => {
      if (res.home_score !== null && res.away_score !== null) {
        persistMatchResultToLocalJson(res.id, res.home_score, res.away_score);
      }
    });

    // Para cada partido finalizado en DB, buscamos sus metadatos en los JSON de configuración
    // y construimos la estructura compatible con el resto de la función.
    const finishedMatches = dbFinished.map(res => {
      const groupMatch = worldCupData.partidos.find(m => m.id === res.id);
      const koMatch = knockoutData.rondas.flatMap(r => r.partidos).find(m => m.id === res.id);
      const meta = groupMatch || koMatch;

      return {
        id: res.id,
        goles_local: res.home_score ?? 0,
        goles_visitante: res.away_score ?? 0,
        equipo_local: res.home_team_id || (meta as any)?.local || 'TBD',
        equipo_visitante: res.away_team_id || (meta as any)?.visitante || 'TBD',
        estado: 'finalizado',
        path: (meta as any)?.path,
        winner_id_manual: (meta as any)?.winner_id_manual
      };
    });

    const finishedMatchIds = finishedMatches.map(m => m.id.toString());
    
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
        return { 
          ...pred,
          points_earned: puntos 
        };
      }).filter((item): item is any => item !== null);

      if (predictionUpdates.length > 0) {
        const { error: upsertError } = await supabase.from('predictions').upsert(predictionUpdates);
        if (upsertError) {
          console.error("❌ [Oráculo] Error al realizar upsert de predicciones:", upsertError);
          throw upsertError;
        }
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
    const KNOCKOUT_PATH_MAP: Record<number, { next_match: number; next_pos: 'home' | 'away' }> = {
      // 16avos -> Octavos
      73: { next_match: 90, next_pos: 'home' },
      74: { next_match: 89, next_pos: 'home' },
      75: { next_match: 90, next_pos: 'away' },
      76: { next_match: 93, next_pos: 'home' },
      77: { next_match: 89, next_pos: 'away' },
      78: { next_match: 93, next_pos: 'away' },
      79: { next_match: 94, next_pos: 'home' },
      80: { next_match: 94, next_pos: 'away' },
      81: { next_match: 92, next_pos: 'home' },
      82: { next_match: 92, next_pos: 'away' },
      83: { next_match: 91, next_pos: 'home' },
      84: { next_match: 91, next_pos: 'away' },
      85: { next_match: 96, next_pos: 'home' },
      86: { next_match: 95, next_pos: 'home' },
      87: { next_match: 96, next_pos: 'away' },
      88: { next_match: 95, next_pos: 'away' },

      // Octavos -> Cuartos
      89: { next_match: 97, next_pos: 'home' },
      90: { next_match: 97, next_pos: 'away' },
      91: { next_match: 99, next_pos: 'home' },
      92: { next_match: 99, next_pos: 'away' },
      93: { next_match: 98, next_pos: 'home' },
      94: { next_match: 98, next_pos: 'away' },
      95: { next_match: 100, next_pos: 'home' },
      96: { next_match: 100, next_pos: 'away' },

      // Cuartos -> Semifinales
      97: { next_match: 101, next_pos: 'home' },
      98: { next_match: 101, next_pos: 'away' },
      99: { next_match: 102, next_pos: 'home' },
      100: { next_match: 102, next_pos: 'away' }
    };

    const knockoutFinalized = finishedMatches.filter(m => m.id >= 73);
    console.log(`[Oráculo] Procesando ${knockoutFinalized.length} partidos knockout finalizados...`);
    
    if (knockoutFinalized.length > 0) {
      const advancementUpdates: any[] = [];

      for (const match of knockoutFinalized) {
        // Determinar ganador y perdedor
        let winnerId = null;
        let loserId = null;
        if (match.goles_local > match.goles_visitante) {
          winnerId = match.equipo_local;
          loserId = match.equipo_visitante;
        } else if (match.goles_visitante > match.goles_local) {
          winnerId = match.equipo_visitante;
          loserId = match.equipo_local;
        } else {
          winnerId = match.winner_id_manual || match.equipo_local; 
          loserId = winnerId === match.equipo_local ? match.equipo_visitante : match.equipo_local;
        }

        if (winnerId) winnerId = winnerId === 'ZA' ? 'RSA' : winnerId;
        if (loserId) loserId = loserId === 'ZA' ? 'RSA' : loserId;

        // Avanzar según el mapa
        const path = KNOCKOUT_PATH_MAP[match.id];
        if (path && winnerId) {
          console.log(`[Oráculo] Ganador detectado para partido #${match.id}: ${winnerId}. Promoviendo a #${path.next_match} (${path.next_pos})`);
          advancementUpdates.push({
            id: path.next_match,
            home_team_id: path.next_pos === 'home' ? winnerId : undefined,
            away_team_id: path.next_pos === 'away' ? winnerId : undefined
          });
        }

        // Semifinales -> Final y 3er puesto
        if (match.id === 101) {
          if (winnerId) {
            console.log(`[Oráculo] Ganador de Semifinal #101: ${winnerId}. Promoviendo a Final #104 (home)`);
            advancementUpdates.push({ id: 104, home_team_id: winnerId });
          }
          if (loserId) {
            console.log(`[Oráculo] Perdedor de Semifinal #101: ${loserId}. Promoviendo a 3er Puesto #103 (home)`);
            advancementUpdates.push({ id: 103, home_team_id: loserId });
          }
        } else if (match.id === 102) {
          if (winnerId) {
            console.log(`[Oráculo] Ganador de Semifinal #102: ${winnerId}. Promoviendo a Final #104 (away)`);
            advancementUpdates.push({ id: 104, away_team_id: winnerId });
          }
          if (loserId) {
            console.log(`[Oráculo] Perdedor de Semifinal #102: ${loserId}. Promoviendo a 3er Puesto #103 (away)`);
            advancementUpdates.push({ id: 103, away_team_id: loserId });
          }
        }
      }

      if (advancementUpdates.length > 0) {
        // Leer partidos de destino actuales para no borrar el otro clasificado (Fusión Inteligente)
        const targetIds = advancementUpdates.map(u => u.id);
        const { data: currentTargets } = await supabase
          .from('match_results')
          .select('id, home_team_id, away_team_id')
          .in('id', targetIds);

        const mergedUpdates = advancementUpdates.map(update => {
          const current = currentTargets?.find(t => t.id === update.id);
          return {
            id: update.id,
            home_team_id: update.home_team_id !== undefined ? update.home_team_id : (current?.home_team_id || null),
            away_team_id: update.away_team_id !== undefined ? update.away_team_id : (current?.away_team_id || null),
            status: 'pending',
            last_sync: new Date().toISOString()
          };
        });

        console.log(`[Oráculo] Enviando ${mergedUpdates.length} actualizaciones fusionadas a match_results:`, mergedUpdates);
        const { error: advError } = await supabase.from('match_results').upsert(mergedUpdates);
        if (advError) {
          console.error("[Oráculo] Error en avance de llaves:", advError);
        } else {
          console.log("[Oráculo] Avance de llaves persistido con éxito.");
        }
      }
    }

    return { success: true, message: "Auditoría de Liga y Avance de Llaves completados." };

  } catch (error: any) {
    console.error("[Oráculo] Error:", error);
    return { success: false, message: error.message };
  }
}
