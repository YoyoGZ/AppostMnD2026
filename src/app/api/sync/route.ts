import { sportsSyncAgent } from "@/services/SportsSyncAgent";
import { NextResponse } from "next/server";
import { processFinishedMatches } from "@/app/actions/oracle";
import { createAdminClient } from "@/utils/supabase/admin";
import worldCupData from "@/data/world-cup-2026.json";

export const dynamic = 'force-dynamic';

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

  // 1. Bloqueo estático en la ventana de inactividad garantizada diaria en Argentina (GMT-3)
  // Ningún partido se juega ni comienza entre las 03:00 AM y las 12:00 PM (mediodía) hora de Argentina.
  const now = new Date();
  const argTimeText = now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" });
  const argDate = new Date(argTimeText);
  const argHour = argDate.getHours();

  if (argHour >= 3 && argHour < 12) {
    console.log(`[API-Sync] Omitiendo llamada externa: Bloqueo de horario de inactividad de Argentina (Hora ARG: ${argHour} hs).`);
    return NextResponse.json({
      success: true,
      updatedCount: 0,
      oracleTriggered: false,
      message: "Sincronización omitida por ventana estática de inactividad (Madrugada/Mañana ARG).",
      timestamp: new Date().toISOString()
    });
  }

  // 2. Evitar llamadas a la API externa fuera de la ventana dinámica del fixture (ahorro de requests)
  const isAnyMatchActiveOrInminent = worldCupData.partidos.some(m => {
    const matchDate = new Date(m.fecha);
    const diffMinutes = (now.getTime() - matchDate.getTime()) / (60 * 1000);
    // Ventana: desde 30 minutos antes de comenzar hasta 3 horas después del inicio
    return diffMinutes >= -30 && diffMinutes < 180;
  });

  if (!isAnyMatchActiveOrInminent) {
    console.log("[API-Sync] Omitiendo llamada externa: no hay partidos programados en juego en esta ventana horaria.");
    return NextResponse.json({
      success: true,
      updatedCount: 0,
      oracleTriggered: false,
      message: "Sincronización omitida por ventana de inactividad de partidos.",
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log("[API-Sync] Iniciando sincronización de marcadores y estados en vivo...");
    
    // Generamos los IDs de los 72 partidos de la Fase de Grupos
    const fixtureIds = Array.from({ length: 72 }, (_, i) => i + 1);
    
    const result = await sportsSyncAgent.syncMatchesToDatabase(fixtureIds);

    if (result.success) {
      console.log(`[API-Sync] Sincronización de fixture finalizada correctamente. ${result.updatedCount} partidos procesados.`);
      
      // --- TRIGGER INTELIGENTE DE ORÁCULO POR EVENTO ---
      let oracleTriggered = false;
      try {
        const supabase = createAdminClient();
        // Buscar partidos finalizados en la BD cuya sincronización haya ocurrido en los últimos 3 minutos
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
        const { data: recentlyFinished, error: checkError } = await supabase
          .from('match_results')
          .select('id')
          .eq('status', 'finished')
          .gte('last_sync', threeMinutesAgo);

        if (checkError) throw checkError;

        if (recentlyFinished && recentlyFinished.length > 0) {
          console.log(`⚽ [API-Sync] DETECTADO PARTIDO FINALIZADO RECIENTEMENTE (IDs: ${recentlyFinished.map(m => m.id).join(', ')}). Gatillando Oráculo...`);
          const oracleResult = await processFinishedMatches();
          oracleTriggered = true;
          console.log("[API-Sync] Oráculo completado automáticamente:", oracleResult);
        } else {
          console.log("[API-Sync] No se detectaron nuevos partidos finalizados. Oráculo omitido para optimizar cómputo.");
        }
      } catch (oracleErr) {
        console.error("❌ [API-Sync] Error al intentar ejecutar el Oráculo de forma automática:", oracleErr);
        // No fallamos la petición de sync si sólo falló el oráculo automático
      }

      return NextResponse.json({
        success: true,
        updatedCount: result.updatedCount,
        oracleTriggered,
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
