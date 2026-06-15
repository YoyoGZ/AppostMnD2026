"use server";

import { sportsSyncAgent } from "@/services/SportsSyncAgent";
import { createAdminClient } from "@/utils/supabase/admin";
import { calculateGroupStandings } from "./tournament-engine";
import worldCupData from "@/data/world-cup-2026.json";
import { processFinishedMatches } from "./oracle";

// Control de frecuencia de sincronización en memoria del servidor
let lastSyncGlobalTime = 0;
const SYNC_COOLDOWN_MS = 60000; // 1 minuto de cooldown entre llamadas reales a la API

export async function syncLiveMatchesAction(): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  const now = Date.now();
  if (now - lastSyncGlobalTime < SYNC_COOLDOWN_MS) {
    console.log(`[Sync Server Action] ⏳ Sincronización bloqueada por límite de frecuencia. Faltan ${Math.ceil((SYNC_COOLDOWN_MS - (now - lastSyncGlobalTime)) / 1000)}s para la próxima consulta real.`);
    return { success: true, updatedCount: 0 };
  }

  lastSyncGlobalTime = now;
  console.log("[Sync Server Action] 🚀 Iniciando sincronización real con la API externa de deportes...");

  try {
    // Excluimos los partidos que ya están finalizados en el JSON local de la sincronización de la API externa
    const fixtureIds = worldCupData.partidos
      .filter((p: any) => p.estado !== 'finalizado')
      .map((p: any) => p.id);

    if (fixtureIds.length === 0) {
      console.log("[Sync Server Action] 🏖️ Todos los partidos de grupos están finalizados en el JSON local. Omitiendo petición a la API.");
      return { success: true, updatedCount: 0 };
    }
    
    // Sincronización 100% real de marcadores desde la API
    const result = await sportsSyncAgent.syncMatchesToDatabase(fixtureIds);
    if (result.success) {
      console.log(`[Sync Server Action] ✅ Sincronización finalizada con éxito. Partidos modificados: ${result.updatedCount}`);
      
      // Gatillar el oráculo para recalculado de puntos si hubo cambios en los partidos
      try {
        console.log("[Sync Server Action] Gatillando oráculo de recálculo de puntos para partidos finalizados...");
        const oracleResult = await processFinishedMatches();
        console.log("[Sync Server Action] Oráculo ejecutado de forma automática:", oracleResult.message);
      } catch (oracleErr: any) {
        console.error("[Sync Server Action] Error al ejecutar el oráculo tras sincronización:", oracleErr);
      }

      return { success: true, updatedCount: result.updatedCount };
    } else {
      return { success: false, updatedCount: 0, error: "La sincronización falló. Verifique su API Key de deportes." };
    }
  } catch (error: any) {
    console.error("Error en syncLiveMatchesAction:", error);
    return { success: false, updatedCount: 0, error: error.message || "Error desconocido" };
  }
}

export async function clearAllMatchResultsAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    // Borramos todos los partidos (fase de grupos y eliminatorias)
    const { error } = await supabase
      .from('match_results')
      .delete()
      .not('id', 'is', null);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error("Error reseteando match_results:", error);
    return { success: false, error: error.message || "Error al limpiar la base de datos" };
  }
}

export async function getStandingsAction(): Promise<{ success: boolean; standings?: any[]; error?: string }> {
  try {
    const standings = await sportsSyncAgent.getStandings(1, 2026);
    return { success: true, standings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStandingsLocalAction(): Promise<{ success: boolean; standings?: any[]; error?: string }> {
  try {
    const localStandings = await calculateGroupStandings();
    
    // Transformar Record<string, TeamStanding[]> al formato array de arrays (any[][])
    // esperado por el Dashboard para no romper compatibilidad.
    const formattedStandings = Object.entries(localStandings).map(([groupLetter, teams]) => {
      return teams.map(t => ({
        team: {
          id: t.teamId,
          name: t.nombre
        },
        points: t.pts,
        group: `Grupo ${groupLetter}`
      }));
    });

    return { success: true, standings: formattedStandings };
  } catch (error: any) {
    console.error("Error en getStandingsLocalAction:", error);
    return { success: false, error: error.message };
  }
}

export async function getRecentGoalsAction(): Promise<{ success: boolean; goals?: Record<string, any>; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .like('key', 'goal_%');

    if (error) throw error;

    const goals: Record<string, any> = {};
    data?.forEach(row => {
      const matchId = row.key.replace('goal_', '');
      try {
        goals[matchId] = JSON.parse(row.value);
      } catch (e) {
        console.error("Error parsing goal JSON:", e);
      }
    });

    return { success: true, goals };
  } catch (error: any) {
    console.error("Error en getRecentGoalsAction:", error);
    return { success: false, error: error.message };
  }
}

export async function getLiveMatchTestAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const liveData = await sportsSyncAgent.getAnyRealLiveMatch();
    if (liveData) {
      return { success: true, data: liveData };
    }
    return { success: false, error: "No hay ningún partido de fútbol jugándose en el mundo en este exacto momento." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
