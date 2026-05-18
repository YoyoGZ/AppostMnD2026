"use server";

import { createClient } from "@/utils/supabase/server";
import { requireRole } from "@/utils/auth/requireRole";

/**
 * Obtiene el estado actual del modo test de precios (Founder Pass a $20 vs $50,000)
 */
export async function getTestModeAction() {
  try {
    const supabase = await createClient();
    
    // Consulta robusta a app_settings
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'founder_pass_test_mode')
      .single();

    if (error) {
      // Si la tabla no existe o no tiene el registro, devolvemos false como fallback seguro
      return { success: true, active: false };
    }

    return { success: true, active: data.value === 'true' };
  } catch (err) {
    console.error("Error obteniendo test mode:", err);
    return { success: true, active: false }; // Fallback resiliente
  }
}

/**
 * Alterna el estado del modo test en caliente (requiere rol super_admin)
 */
export async function toggleTestModeAction(active: boolean) {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key: 'founder_pass_test_mode', 
      value: active ? 'true' : 'false' 
    }, { onConflict: 'key' });

  if (error) {
    console.error("Error al actualizar test mode settings:", error);
    return { 
      success: false, 
      error: "Error en la base de datos. Por favor verifica que hayas ejecutado la migración SQL en Supabase para crear la tabla 'app_settings'." 
    };
  }

  return { success: true, active };
}

/**
 * Obtiene las compras reales de Mercado Pago para el panel de Censo Global
 */
export async function fetchMpPaymentsAction() {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return { success: false, error: "Token de acceso de Mercado Pago no configurado" };
  }

  try {
    // Consultar los cobros directamente a la API de Mercado Pago
    // Buscamos ordenados por fecha de creación descendente, limitando a las últimas 30 transacciones
    const mpUrl = "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=30";
    
    const response = await fetch(mpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // No almacenar en caché estas consultas en vivo
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error al buscar en MP:", errText);
      return { success: false, error: `Error de Mercado Pago (HTTP ${response.status})` };
    }

    const data = await response.json();
    
    // Mapear los datos de Mercado Pago a una estructura premium y segura
    const payments = (data.results || []).map((p: any) => ({
      id: p.id,
      status: p.status, // approved, pending, rejected, in_process, cancelled
      status_detail: p.status_detail,
      amount: p.transaction_amount,
      currency: p.currency_id,
      date: p.date_created,
      email: p.payer?.email || "Sin Email",
      league_name: p.metadata?.league_name || "Desconocida",
      user_id: p.metadata?.user_id || null,
      payment_method: p.payment_method_id
    }));

    return { success: true, payments };
  } catch (err: any) {
    console.error("Error en fetchMpPaymentsAction:", err);
    return { success: false, error: err.message || "Error de conexión con Mercado Pago" };
  }
}
