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
    const supabaseAdmin = createAdminClient();

    // 1. Obtener la lista de usuarios (profiles) reales en Supabase para el cruce atómico
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email');

    if (profilesError) {
      console.error("Error al obtener perfiles para censo cruzado:", profilesError);
      return { success: false, error: "Error de base de datos al realizar el censo cruzado" };
    }

    // Crear sets para búsquedas eficientes en memoria
    const registeredEmails = new Set(
      (profiles || [])
        .map(u => u.email?.toLowerCase().trim())
        .filter(Boolean)
    );
    const registeredIds = new Set(
      (profiles || [])
        .map(u => u.id)
        .filter(Boolean)
    );

    // 2. Consultar los cobros directamente a la API de Mercado Pago
    // Buscamos ordenados por fecha de creación descendente, limitando a las últimas 50 transacciones para mayor cobertura
    const mpUrl = "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=50";
    
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
    
    // 3. Mapear y purificar los datos con filtros atómicos (email en DB, metadata, y fecha límite)
    const payments = (data.results || [])
      .map((p: any) => {
        const userId = p.metadata?.user_id || null;
        
        return {
          id: p.id,
          status: p.status, // approved, pending, rejected, in_process, cancelled
          status_detail: p.status_detail,
          amount: p.transaction_amount,
          currency: p.currency_id,
          date: p.date_created,
          email: p.payer?.email || "Sin Email",
          league_name: p.metadata?.league_name || null,
          user_id: userId,
          payment_method: p.payment_method_id,
          description: p.description || ""
        };
      })
      .filter((p: any) => {
        // Regla 1: El correo o el user_id de la transacción debe pertenecer a un usuario registrado en Supabase
        const emailLower = p.email.toLowerCase().trim();
        const isRegistered = registeredEmails.has(emailLower) || (p.user_id && registeredIds.has(p.user_id));
        
        // Regla 2: El cobro debe ser del proyecto MundiApp26 (tener metadata de liga o mencionar la app)
        const isMundiApp = p.league_name !== null || p.description.toLowerCase().includes("mundiapp26");
        
        // Regla 3: El cobro debe ser posterior al lanzamiento del proyecto (1 de mayo de 2026)
        const paymentDate = new Date(p.date);
        const releaseDate = new Date('2026-05-01T00:00:00Z');
        const isValidDate = paymentDate >= releaseDate;

        return isRegistered && isMundiApp && isValidDate;
      });

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

    // 2. Obtener la lista de correos corporativos pre-aprobados para excluirlos del sorteo
    const { data: corporateRelations, error: corpError } = await supabaseAdmin
      .from('corporate_relations')
      .select('email');

    if (corpError) {
      console.error("Error cargando relaciones corporativas para exclusión:", corpError);
    }

    const excludedEmails = new Set(
      (corporateRelations || []).map(r => r.email.trim().toLowerCase())
    );

    // 3. Traer un pool más grande de perfiles con rol founder ordenados por created_at ASC
    // Usamos un límite de 200 para permitir la exclusión en memoria de las cuentas corporativas
    const { data: rawCandidates, error: candidatesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, role, created_at')
      .eq('role', 'founder')
      .order('created_at', { ascending: true })
      .limit(200);

    if (candidatesError) {
      console.error("Error cargando candidatos del sorteo:", candidatesError);
      return { success: false, error: "Error al consultar los fundadores" };
    }

    if (!rawCandidates || rawCandidates.length === 0) {
      return { success: false, error: "No hay fundadores registrados en el sistema para realizar el sorteo." };
    }

    // 4. Filtrar excluyendo atómicamente a los fundadores corporativos patrocinados
    const candidates = rawCandidates
      .filter(c => {
        const email = c.email?.trim().toLowerCase();
        return email && !excludedEmails.has(email);
      })
      .slice(0, 50);

    if (candidates.length === 0) {
      return { success: false, error: "No hay fundadores no-corporativos válidos para el sorteo." };
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

/**
 * Obtiene todos los perfiles de usuario registrados
 */
export async function getAllProfilesAction(searchQuery?: string) {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  try {
    const supabaseAdmin = createAdminClient();
    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, role, created_at');

    if (searchQuery && searchQuery.trim() !== '') {
      const cleanSearch = searchQuery.trim();
      query = query.or(`display_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error al obtener perfiles:", error);
      return { success: false, error: "Error consultando base de datos" };
    }

    return { success: true, users: data };
  } catch (err: any) {
    console.error("Error en getAllProfilesAction:", err);
    return { success: false, error: err.message || "Error inesperado" };
  }
}

/**
 * Resetear la clave de un jugador en Supabase Auth mediante Admin API
 */
export async function resetUserPasswordAction(userId: string, newPassword?: string) {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  if (!userId) {
    return { success: false, error: "ID de usuario inválido" };
  }

  const targetPassword = newPassword && newPassword.trim() !== '' ? newPassword.trim() : 'ABCD1234';

  try {
    const supabaseAdmin = createAdminClient();
    
    // Forzamos el cambio de contraseña en Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: targetPassword }
    );

    if (error) {
      console.error("Error de Supabase Auth Admin al resetear contraseña:", error);
      return { success: false, error: `Error en Supabase Auth: ${error.message}` };
    }

    return { success: true, newPassword: targetPassword };
  } catch (err: any) {
    console.error("Error en resetUserPasswordAction:", err);
    return { success: false, error: err.message || "Error inesperado restableciendo contraseña" };
  }
}

/**
 * Verifica si un alias de jugador ya está registrado en la base de datos (pública)
 */
export async function checkAliasAvailabilityAction(alias: string) {
  if (!alias || alias.trim().length < 2) {
    return { success: true, available: false, error: "El apodo debe tener al menos 2 caracteres." };
  }

  try {
    const supabase = await createClient(); // Cliente normal
    const cleanAlias = alias.trim();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', cleanAlias)
      .maybeSingle();

    if (error) {
      console.error("Error al consultar disponibilidad de alias:", error);
      return { success: true, available: true }; // Fallback seguro
    }

    return { success: true, available: !data };
  } catch (err) {
    console.error("Error en checkAliasAvailabilityAction:", err);
    return { success: true, available: true };
  }
}

/**
 * Obtiene todas las relaciones corporativas (para el panel Co-Branding en HQ)
 */
export async function getCorporateRelationsAction() {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('corporate_relations')
      .select('email, brand_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error al obtener relaciones corporativas:", error);
      return { success: false, error: "Error consultando base de datos" };
    }

    return { success: true, relations: data };
  } catch (err: any) {
    console.error("Error en getCorporateRelationsAction:", err);
    return { success: false, error: err.message || "Error inesperado" };
  }
}

/**
 * Agrega una nueva relación corporativa en caliente (Bypass de Pago)
 */
export async function addCorporateRelationAction(email: string, brandId: string) {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  if (!email || !brandId) {
    return { success: false, error: "Email y Marca son campos obligatorios." };
  }

  const emailLower = email.trim().toLowerCase();
  const brandClean = brandId.trim().toLowerCase();

  try {
    const supabase = await createClient();

    // 1. Validar si ya existe
    const { data: existing } = await supabase
      .from('corporate_relations')
      .select('email')
      .eq('email', emailLower)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `El correo '${emailLower}' ya está registrado con una marca.` };
    }

    // 2. Insertar nueva relación
    const { error } = await supabase
      .from('corporate_relations')
      .insert({
        email: emailLower,
        brand_id: brandClean
      });

    if (error) {
      console.error("Error al insertar relación corporativa:", error);
      return { success: false, error: "Error de base de datos al asociar la marca." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error en addCorporateRelationAction:", err);
    return { success: false, error: err.message || "Error inesperado" };
  }
}

/**
 * Elimina una relación corporativa en caliente
 */
export async function deleteCorporateRelationAction(email: string) {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  if (!email) {
    return { success: false, error: "Email requerido para eliminar." };
  }

  const emailLower = email.trim().toLowerCase();

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('corporate_relations')
      .delete()
      .eq('email', emailLower);

    if (error) {
      console.error("Error al eliminar relación corporativa:", error);
      return { success: false, error: "Error de base de datos al desvincular." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error en deleteCorporateRelationAction:", err);
    return { success: false, error: err.message || "Error inesperado" };
  }
}



