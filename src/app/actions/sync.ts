"use server";

import { sportsSyncAgent } from "@/services/SportsSyncAgent";
import { createAdminClient } from "@/utils/supabase/admin";

export async function forceMockSyncAction(): Promise<
  | { success: true; updatedCount: number }
  | { success: false; error: string }
> {
  try {
    // Generamos los IDs de los 72 partidos de la Fase de Grupos
    const fixtureIds = Array.from({ length: 72 }, (_, i) => i + 1);
    
    const result = await sportsSyncAgent.syncMatchesToDatabase(fixtureIds);
    if (result.success) {
      return { success: true, updatedCount: result.updatedCount };
    } else {
      return { success: false, error: "Sincronización fallida sin detalles." };
    }
  } catch (error: any) {
    console.error("Error forzando sincronización:", error);
    return { success: false, error: error.message || "Error desconocido" };
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
