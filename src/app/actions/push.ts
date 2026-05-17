"use server";

import { createClient } from "@/utils/supabase/server";

export async function savePushSubscriptionAction(payload: { endpoint: string, p256dh: string | null, auth: string | null }) {
  try {
    const supabase = await createClient();
    
    // Validar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    if (!payload.endpoint || !payload.p256dh || !payload.auth) {
      return { success: false, error: "Estructura de suscripción inválida" };
    }

    // Upsert en la base de datos (por si actualiza la suscripción del mismo dispositivo)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: payload.endpoint,
        p256dh_key: payload.p256dh,
        auth_key: payload.auth,
      }, {
        onConflict: 'user_id, endpoint' // Basado en nuestro UNIQUE constraint
      });

    if (error) {
      console.error("Error guardando suscripción:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error crítico en savePushSubscriptionAction:", error);
    return { success: false, error: error.message };
  }
}
