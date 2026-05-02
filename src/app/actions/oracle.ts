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
    // que coincidan con los IDs de los partidos finalizados.
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

        const { puntos, aciertoSimple, plenoExacto } = calculatePoints(
          pred.equipo_a_goles,
          pred.equipo_b_goles,
          match.goles_local,
          match.goles_visitante
        );

        console.log(`[Oráculo] Matemática: Predijo ${pred.equipo_a_goles}-${pred.equipo_b_goles}. Real ${match.goles_local}-${match.goles_visitante}. PUNTOS: ${puntos}`);

        // Actualizar la predicción
        const { data: updatedData, error: predError } = await supabase
          .from('predictions')
          .update({ points_earned: puntos })
          .eq('id', pred.id)
          .select();
          
        if (predError) {
          console.error("[Oráculo] Error al actualizar predicción:", predError);
        } else if (!updatedData || updatedData.length === 0) {
          console.warn(`[Oráculo WARNING] Supabase ignoró la actualización del boleto ${pred.id}. ¡Problema de Permisos RLS detectado!`);
        } else {
          console.log(`[Oráculo] Boleto ${pred.id} guardado en BD con éxito.`);
        }
      }
    } else {
      console.log("[Oráculo] No hay apuestas nuevas pendientes, forzando recálculo de tabla de posiciones...");
    }

    // 4. Recalcular tabla de posiciones TOTAL desde cero (Resistente a Race Conditions)
    // Traemos a todos los miembros de la liga para recalcularles sus puntos
    const { data: members, error: membersError } = await supabase
      .from('league_members')
      .select('user_id');

    if (membersError) {
      console.error("[Oráculo] Error al obtener miembros:", membersError);
      return { success: false, message: "Falló la lectura de liga." };
    }

    if (members) {
      for (const member of members) {
        const userId = member.user_id;
        
        // Traer TODAS las predicciones ya procesadas de este usuario
        const { data: userPreds, error: predsError } = await supabase
          .from('predictions')
          .select('points_earned')
          .eq('user_id', userId)
          .not('points_earned', 'is', null);

        if (predsError) {
          console.error(`[Oráculo] Error al traer predicciones procesadas para ${userId}:`, predsError);
        }

        if (userPreds) {
          let totalPts = 0;
          let aciertos = 0;
          let plenos = 0;

          for (const p of userPreds) {
            const pts = p.points_earned || 0;
            totalPts += pts;
            
            if (pts === 5) {
              plenos += 1;
              aciertos += 1;
            } else if (pts === 2) {
              aciertos += 1;
            }
          }

          // Actualizamos usando el Total Real, no acumulando
          const { error: memberError } = await supabase
            .from('league_members')
            .update({
              total_pts: totalPts,
              aciertos_simples: aciertos,
              plenos_exactos: plenos
            })
            .eq('user_id', userId);
            
          if (memberError) {
            console.error(`[Oráculo] Error de Permisos RLS al actualizar league_members de ${userId}:`, memberError);
          } else {
            console.log(`[Oráculo] Puntos auditados para ${userId}: ${totalPts} pts`);
          }
        }
      }
    }

    // 5. Resolver Duelos Activos
    console.log(`[Oráculo] Buscando duelos para partidos: ${finishedMatchIds.join(', ')}`);
    
    const { data: activeDuels, error: duelsError } = await supabase
      .from('league_duels')
      .select('id, match_id')
      .eq('status', 'active')
      .in('match_id', finishedMatchIds);

    if (duelsError) {
      console.error("[Oráculo] Error al buscar duelos:", duelsError);
    }

    if (activeDuels && activeDuels.length > 0) {
      console.log(`[Oráculo] Encontrados ${activeDuels.length} duelos para procesar.`);
      
      for (const duel of activeDuels) {
        console.log(`[Oráculo] Procesando Duelo ID: ${duel.id} (Partido: ${duel.match_id})`);
        
        const { data: participants, error: pError } = await supabase
          .from('duel_participants')
          .select('user_id')
          .eq('duel_id', duel.id);
          
        if (pError) console.error(`[Oráculo] Error al traer participantes del duelo ${duel.id}:`, pError);

        if (participants && participants.length > 0) {
          const userIds = participants.map(p => p.user_id);
          
          // Buscamos las predicciones. Forzamos match_id a string por si acaso.
          const { data: preds, error: prError } = await supabase
            .from('predictions')
            .select('user_id, points_earned')
            .eq('match_id', duel.match_id.toString())
            .in('user_id', userIds);
            
          if (prError) console.error(`[Oráculo] Error al traer predicciones para duelo ${duel.id}:`, prError);

          let maxPoints = -1;
          const userPoints: Record<string, number> = {};
          userIds.forEach(u => userPoints[u] = 0);
          
          if (preds && preds.length > 0) {
            preds.forEach(p => {
              const pts = p.points_earned || 0;
              userPoints[p.user_id] = pts;
              if (pts > maxPoints) maxPoints = pts;
            });
          }

          const winners = userIds.filter(uid => userPoints[uid] === maxPoints && maxPoints > 0);
          
          if (winners.length > 0) {
            console.log(`[Oráculo] Duelo ${duel.id}: Ganadores detectados -> ${winners.join(', ')}`);
            for (const winnerId of winners) {
              await supabase
                .from('duel_participants')
                .update({ is_winner: true })
                .eq('duel_id', duel.id)
                .eq('user_id', winnerId);
            }
          } else {
            console.log(`[Oráculo] Duelo ${duel.id}: No hay ganadores claros (Empate a 0 o sin apuestas).`);
          }
          
          // Forzamos el cierre del duelo sin importar si hubo ganadores
          const { error: closeError } = await supabase
            .from('league_duels')
            .update({ status: 'resolved' })
            .eq('id', duel.id);

          if (closeError) console.error(`[Oráculo] Error al cerrar duelo ${duel.id}:`, closeError);
          else console.log(`[Oráculo] Duelo ${duel.id} marcado como RESOLVED.`);
        }
      }
    }

    return { 
      success: true, 
      message: `Auditoría finalizada. Duelos procesados: ${activeDuels?.length || 0}` 
    };

  } catch (error) {
    console.error("[Oráculo] Error fatal:", error);
    return { success: false, message: "Falló el procesamiento." };
  }
}
