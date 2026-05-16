"use server";

import { sportsSyncAgent } from "@/services/SportsSyncAgent";

export async function forceMockSyncAction(): Promise<
  | { success: true; updatedCount: number }
  | { success: false; error: string }
> {
  try {
    // Simulamos la sincronización de los partidos 2, 3 y 4
    const result = await sportsSyncAgent.syncMatchesToDatabase([2, 3, 4]);
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
