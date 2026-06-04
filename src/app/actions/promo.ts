"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole } from "@/utils/auth/requireRole";

/**
 * Valida de forma segura si un código de promoción existe en la base de datos
 */
export async function validatePromoCodeAction(code: string) {
  if (!code || code.trim().length === 0) {
    return { success: true, valid: false, error: "Por favor, ingresá un código." };
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promo_codes")
      .select("code, owner_name")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error) {
      console.error("Error al validar código promocional:", error);
      return { success: true, valid: false, error: "Error al validar con el servidor." };
    }

    if (!data) {
      return { success: true, valid: false, error: "El código no existe." };
    }

    return { success: true, valid: true, ownerName: data.owner_name, code: data.code };
  } catch (err) {
    console.error("Error en validatePromoCodeAction:", err);
    return { success: true, valid: false, error: "Error inesperado de red." };
  }
}

/**
 * Asocia de forma síncrona el código de promoción al perfil del usuario autenticado
 */
export async function savePromoCodeToProfileAction(code: string) {
  if (!code || code.trim().length === 0) {
    return { success: false, error: "Código requerido." };
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    const supabase = await createClient();

    // 1. Obtener la sesión activa del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Tenés que iniciar sesión para aplicar el código." };
    }

    // 2. Verificar que el código promocional sea legítimo
    const { data: promo, error: promoError } = await supabase
      .from("promo_codes")
      .select("code")
      .eq("code", cleanCode)
      .maybeSingle();

    if (promoError || !promo) {
      return { success: false, error: "El código promocional no es válido." };
    }

    // 3. Guardar la afiliación directamente en el perfil
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ referred_by_code: cleanCode })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error al asociar código de promoción en el perfil:", updateError);
      return { success: false, error: "No se pudo guardar la referencia en tu cuenta." };
    }

    return { success: true, code: cleanCode };
  } catch (err: any) {
    console.error("Error en savePromoCodeToProfileAction:", err);
    return { success: false, error: err.message || "Error inesperado de persistencia." };
  }
}

/**
 * Genera un código promocional único y aleatorio (requiere rol super_admin)
 */
export async function generatePromoCodeAction(ownerName: string) {
  try {
    await requireRole("super_admin");
  } catch {
    return { success: false, error: "No autorizado." };
  }

  if (!ownerName || ownerName.trim().length === 0) {
    return { success: false, error: "El nombre es obligatorio." };
  }

  const cleanOwnerName = ownerName.trim();

  try {
    const supabase = await createClient();

    // 1. Generar código alfanumérico aleatorio único de 8 caracteres
    // Excluimos caracteres visualmente confusos (I, O, 0, 1) para un excelente Trust UX
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Validar unicidad en la base de datos
      const { data } = await supabase
        .from("promo_codes")
        .select("code")
        .eq("code", code)
        .maybeSingle();

      if (!data) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return { success: false, error: "No se pudo generar un código único. Intentá de nuevo." };
    }

    // 2. Insertar en la tabla de promo_codes
    const { error: insertError } = await supabase
      .from("promo_codes")
      .insert({
        code,
        owner_name: cleanOwnerName
      });

    if (insertError) {
      console.error("Error al insertar código promocional:", insertError);
      return { success: false, error: "Error de base de datos al guardar el código." };
    }

    return { success: true, code, ownerName: cleanOwnerName };
  } catch (err: any) {
    console.error("Error en generatePromoCodeAction:", err);
    return { success: false, error: err.message || "Error inesperado en el servidor." };
  }
}

/**
 * Obtiene la analítica completa de conversiones de códigos (requiere rol super_admin)
 * Implementa agregación en memoria de alta eficiencia para evitar consultas N+1
 */
export async function getPromoAnalyticsAction() {
  try {
    await requireRole("super_admin");
  } catch {
    return { success: false, error: "No autorizado." };
  }

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Consultar todos los códigos de promoción
    const { data: promoCodes, error: promoError } = await supabaseAdmin
      .from("promo_codes")
      .select("code, owner_name, created_at")
      .order("created_at", { ascending: false });

    if (promoError || !promoCodes) {
      console.error("Error al obtener códigos de promoción:", promoError);
      return { success: false, error: "Error al consultar códigos promocionales." };
    }

    // 2. Consultar todos los perfiles que usaron algún código promocional
    const { data: referredProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, role, referred_by_code")
      .not("referred_by_code", "is", null);

    if (profilesError) {
      console.error("Error al obtener perfiles referidos:", profilesError);
      return { success: false, error: "Error al consultar perfiles afiliados." };
    }

    // 3. Agrupar en memoria los perfiles referidos por código
    const referredGroupMap = new Map<string, Array<{ display_name: string; email: string }>>();

    (referredProfiles || []).forEach((profile) => {
      const code = profile.referred_by_code;
      if (code) {
        const list = referredGroupMap.get(code) || [];
        list.push({
          display_name: profile.display_name || "Jugador Anónimo",
          email: profile.email || "Sin Email"
        });
        referredGroupMap.set(code, list);
      }
    });

    // 4. Mapear y construir la estructura analítica final
    const analytics = promoCodes.map((p) => {
      const users = referredGroupMap.get(p.code) || [];
      return {
        code: p.code,
        ownerName: p.owner_name,
        createdAt: p.created_at,
        usesCount: users.length,
        users: users // Lista de alias y correos de los usuarios registrados con este código
      };
    });

    return { success: true, analytics };
  } catch (err: any) {
    console.error("Error en getPromoAnalyticsAction:", err);
    return { success: false, error: err.message || "Error inesperado en el servidor de analíticas." };
  }
}
