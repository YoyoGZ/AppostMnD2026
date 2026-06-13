import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/keep-alive
 * Endpoint invocado por Vercel Cron cada 3 días.
 * Hace una query liviana a Supabase para mantener el proyecto activo.
 * Protegido por CRON_SECRET para evitar llamadas externas no autorizadas.
 */
export async function GET(request: Request) {
  // Verificar que la llamada viene del Cron de Vercel (no del público)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Query mínima: solo confirma que la DB responde
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error("[Keep-Alive] Error de ping:", error.message);
      return NextResponse.json(
        { success: false, error: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    console.log("[Keep-Alive] Ping exitoso a Supabase:", new Date().toISOString());
    return NextResponse.json({
      success: true,
      message: "Supabase activo",
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("[Keep-Alive] Excepción:", err);
    return NextResponse.json(
      { success: false, error: err.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
