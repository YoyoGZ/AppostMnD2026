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
