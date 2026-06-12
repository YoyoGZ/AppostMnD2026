import { sportsSyncAgent } from "@/services/SportsSyncAgent";
import { NextResponse } from "next/server";

/**
 * GET /api/sync
 * Endpoint invocado de forma periódica por Vercel Cron (u otro orquestador).
 * Sincroniza el estado de los 72 partidos de la Fase de Grupos en Supabase en una sola petición.
 * Protegido por CRON_SECRET para evitar abusos o llamadas externas no autorizadas.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Si hay un CRON_SECRET configurado, se exige autenticación Bearer
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    console.log("[API-Sync] Iniciando sincronización de marcadores y estados en vivo...");
    
    // Generamos los IDs de los 72 partidos de la Fase de Grupos
    const fixtureIds = Array.from({ length: 72 }, (_, i) => i + 1);
    
    const result = await sportsSyncAgent.syncMatchesToDatabase(fixtureIds);

    if (result.success) {
      console.log(`[API-Sync] Sincronización finalizada correctamente. ${result.updatedCount} partidos procesados.`);
      return NextResponse.json({
        success: true,
        updatedCount: result.updatedCount,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error("[API-Sync] Sincronización fallida sin excepciones.");
      return NextResponse.json(
        { success: false, error: "Sincronización fallida sin excepciones", timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

  } catch (err: any) {
    console.error("[API-Sync] Excepción crítica durante la sincronización:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error desconocido", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
