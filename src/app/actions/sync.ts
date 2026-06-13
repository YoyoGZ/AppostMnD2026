"use server";

import { sportsSyncAgent } from "@/services/SportsSyncAgent";
import { createAdminClient } from "@/utils/supabase/admin";
import { calculateGroupStandings } from "./tournament-engine";

export async function syncLiveMatchesAction(): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    // Generamos los IDs de los 72 partidos de la Fase de Grupos
    const fixtureIds = Array.from({ length: 72 }, (_, i) => i + 1);
    
    // Sincronización 100% real de marcadores desde la API
    const result = await sportsSyncAgent.syncMatchesToDatabase(fixtureIds);
    if (result.success) {
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
