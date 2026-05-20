"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
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

/**
 * Obtiene el censo de perfiles registrados (Members vs Founders)
 */
export async function getProfileCensusAction() {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Contar total de members
    const { count: memberCount, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member');

    // 2. Contar total de founders
    const { count: founderCount, error: founderError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'founder');

    if (memberError || founderError) {
      console.error("Error en censo de perfiles:", memberError || founderError);
      return { success: false, error: "Error consultando base de datos" };
    }

    const total = (memberCount || 0) + (founderCount || 0);
    const conversionRate = total > 0 ? ((founderCount || 0) / total) * 100 : 0;

    return {
      success: true,
      census: {
        members: memberCount || 0,
        founders: founderCount || 0,
        total,
        conversionRate: Math.round(conversionRate * 10) / 10
      }
    };
  } catch (err: any) {
    console.error("Error en censo:", err);
    return { success: false, error: err.message || "Error inesperado" };
  }
}

/**
 * Realiza el sorteo de la camiseta oficial entre los primeros 50 founders creados
 */
export async function runRaffleAction() {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Consultar si ya existe un ganador persistido en app_settings
    const { data: existingWinner, error: readWinnerError } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'raffle_winner')
      .maybeSingle();

    if (existingWinner && existingWinner.value) {
      const winnerData = JSON.parse(existingWinner.value);
      // Si ya hay un ganador guardado, devolvemos la lista vacía de candidatos pero con el ganador para preservarlo
      return { success: true, alreadyExists: true, winner: winnerData, candidates: [] };
    }

    // 2. Traer los primeros 50 perfiles con rol founder ordenados por created_at ASC
    const { data: candidates, error: candidatesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, role, created_at')
      .eq('role', 'founder')
      .order('created_at', { ascending: true })
      .limit(50);

    if (candidatesError) {
      console.error("Error cargando candidatos del sorteo:", candidatesError);
      return { success: false, error: "Error al consultar los fundadores" };
    }

    if (!candidates || candidates.length === 0) {
      return { success: false, error: "No hay fundadores registrados en el sistema para realizar el sorteo." };
    }

    // 3. Seleccionar ganador de forma aleatoria
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const winner = candidates[randomIndex];

    // 4. Guardar ganador de forma persistente en app_settings
    const winnerData = {
      id: winner.id,
      email: winner.email || "Sin Email",
      display_name: winner.display_name || "Fundador Anónimo",
      created_at: winner.created_at,
      position: randomIndex + 1 // Posición de registro entre los primeros
    };

    const { error: upsertError } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        key: 'raffle_winner',
        value: JSON.stringify(winnerData)
      }, { onConflict: 'key' });

    if (upsertError) {
      console.error("Error guardando el ganador en app_settings:", upsertError);
    }

    return {
      success: true,
      alreadyExists: false,
      winner: winnerData,
      candidates: candidates.map((c, i) => ({
        id: c.id,
        display_name: c.display_name || "Fundador Anónimo",
        email: c.email || "Sin Email",
        position: i + 1
      }))
    };
  } catch (err: any) {
    console.error("Error en runRaffleAction:", err);
    return { success: false, error: err.message || "Error inesperado durante el sorteo" };
  }
}

/**
 * Obtiene el ganador del sorteo actual de forma persistente
 */
export async function getRaffleWinnerAction() {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'raffle_winner')
      .maybeSingle();

    if (error) {
      console.error("Error consultando ganador del sorteo:", error);
      return { success: true, winner: null };
    }

    if (!data || !data.value) {
      return { success: true, winner: null };
    }

    return { success: true, winner: JSON.parse(data.value) };
  } catch (err: any) {
    console.error("Error obteniendo ganador:", err);
    return { success: true, winner: null };
  }
}

/**
 * Resetea el sorteo limpiando el ganador guardado
 */
export async function resetRaffleAction() {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from('app_settings')
      .delete()
      .eq('key', 'raffle_winner');

    if (error) {
      console.error("Error eliminando ganador en app_settings:", error);
      return { success: false, error: "Error en la base de datos al limpiar el sorteo" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error reseteando sorteo:", err);
    return { success: false, error: err.message || "Error inesperado" };
  }
}
