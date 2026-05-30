"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializar el SDK de Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 }
});

export async function mockPaymentAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "No autenticado" };
  }

  // Instanciar Admin Client para saltar RLS
  const supabaseAdmin = createAdminClient();

  // Obtener max_leagues actual para incrementarlo
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('max_leagues')
    .eq('id', user.id)
    .single();

  const currentMax = profile?.max_leagues || 0;

  // MOCK: Ascender a founder en la base de datos saltando el escudo RLS e incrementar slots
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: 'founder',
      max_leagues: currentMax + 1
    })
    .eq('id', user.id);

  if (error) {
    console.error("Error en mockPayment:", error);
    return { error: "Fallo al simular el pago" };
  }

  // Devolver éxito para que el cliente haga el redirect
  return { success: true };
}

export async function createPaymentPreferenceAction(leagueName: string, joinLeagueCode?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesión no encontrada. Por favor volvé a ingresar." };
    }

    // URL Base dinámica autodetectada en caliente
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const host = headerList.get("host");
    
    let baseUrl = "https://mundiapp26.com"; // Fallback oficial y definitivo de Producción
    
    if (host) {
      const protocol = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") ? "http" : "https";
      baseUrl = `${protocol}://${host}`;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }

    // Consultar en tiempo real el modo test de precios en la base de datos
    const { getTestModeAction } = await import('@/app/actions/admin');
    const testModeResult = await getTestModeAction();
    const finalPrice = testModeResult.active ? 20 : 5000; // $20 en modo test, $5.000 en producción

    // Crear la preferencia de pago
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'founder_pass_2026',
            title: joinLeagueCode ? "Acceso a Liga - MundiApp26" : `Founder Pass - Liga ${leagueName}`,
            description: "Licencia de Plataforma - MundiApp26",
            quantity: 1,
            unit_price: finalPrice, // VALOR DINÁMICO ALTERNABLE
            currency_id: "ARS",
          }
        ],
        // MUY IMPORTANTE: La metadata oculta que Mercado Pago nos devolverá en el Webhook
        metadata: {
          league_name: joinLeagueCode ? null : leagueName, // Para poder crearla o activarla
          user_id: user.id,
          join_code: joinLeagueCode || null
        },
        back_urls: {
          // A donde va el usuario DESPUÉS de pagar
          success: joinLeagueCode 
            ? `${baseUrl}/api/callbacks/mp-success?join=${joinLeagueCode}`
            : `${baseUrl}/api/callbacks/mp-success?league=${encodeURIComponent(leagueName)}`,
          pending: `${baseUrl}/dashboard?status=pending`,
          failure: `${baseUrl}/paywall?status=failure`
        },
        auto_return: "approved",
        // El webhook silencioso (requiere URL pública, en localhost usaremos ngrok o simularemos)
        notification_url: "https://ejemplo-produccion.com/api/webhooks/mercadopago" 
      }
    });

    console.log("💳 [MERCADO PAGO] Preferencia creada:", result.id);

    // Retornamos el link de pago que debemos abrir en el cliente
    return { 
      initPoint: result.init_point || result.sandbox_init_point 
    };

  } catch (error) {
    console.error("❌ Error creando preferencia MP:", error);
    return { error: "No pudimos conectar con Mercado Pago. Intentá en unos minutos." };
  }
}

/**
 * Verifica si el correo del usuario activo está pre-aprobado como Founder corporativo.
 * Si es así, lo promueve a rol 'founder' en profiles saltando el RLS en el servidor.
 */
export async function checkAndPromoteCorporateUserAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { error: "No autenticado o sin correo electrónico." };
    }

    const emailLower = user.email.trim().toLowerCase();

    // 1. Buscar en la tabla corporate_relations
    const { data: relation, error: relError } = await supabase
      .from('corporate_relations')
      .select('brand_id')
      .eq('email', emailLower)
      .maybeSingle();

    if (relError) {
      console.error("Error al buscar relación corporativa:", relError);
      return { error: "Error al validar relación corporativa en la base de datos." };
    }

    if (!relation) {
      // No es un email corporativo pre-aprobado
      return { success: true, isCorporate: false };
    }

    // 2. Si es corporativo, ascenderlo a 'founder' en profiles usando el admin client
       // 2. Si es corporativo, ascenderlo a 'founder' en profiles usando el admin client
    const supabaseAdmin = createAdminClient();
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: 'founder',
        max_leagues: 1 // <-- Agregamos esta línea para habilitarle 1 cupo de creación gratuita
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("Error al ascender a founder corporativo:", updateError);
      return { error: "No se pudo actualizar tu perfil corporativo." };
    }

    console.log(`🏢 [MARCA BLANCA] Usuario ${emailLower} promovido a FOUNDER para la marca ${relation.brand_id}`);
    return { success: true, isCorporate: true, brandId: relation.brand_id };

  } catch (err) {
    console.error("Error en checkAndPromoteCorporateUserAction:", err);
    return { error: "Error interno del servidor al procesar el bypass corporativo." };
  }
}

/**
 * Resuelve el tema corporativo activo para el usuario actual.
 * Aplica el algoritmo de resolución dinámica basándose en la liga a la que pertenece.
 */
export async function resolveBrandThemeAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { brandTheme: null };
    }

    let brandId: string | null = null;

    // 1. Obtener la primera membresía de liga activa del usuario
    const { data: membership } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membership) {
      // 2. Obtener el creador de esa liga
      const { data: league } = await supabase
        .from('leagues')
        .select('created_by')
        .eq('id', membership.league_id)
        .maybeSingle();

      if (league) {
        // 3. Buscar el email del creador en profiles
        const { data: creator } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', league.created_by)
          .maybeSingle();

        if (creator && creator.email) {
          // 4. Buscar relación corporativa para el email del creador
          const { data: relation } = await supabase
            .from('corporate_relations')
            .select('brand_id')
            .eq('email', creator.email.trim().toLowerCase())
            .maybeSingle();

          if (relation) {
            brandId = relation.brand_id;
          }
        }
      }
    }

    // 5. Fallback: Si no tiene liga pero el usuario mismo es un founder corporativo pre-aprobado,
    // resolvemos su propia marca (útil para el onboarding/paywall y primer render)
    if (!brandId) {
      const { data: userRelation } = await supabase
        .from('corporate_relations')
        .select('brand_id')
        .eq('email', user.email.trim().toLowerCase())
        .maybeSingle();

      if (userRelation) {
        brandId = userRelation.brand_id;
      }
    }

    if (!brandId) {
      return { brandTheme: null };
    }

    // 6. Cargar diccionario de temas estático
    const brandThemes = require('@/data/brand-themes.json');
    const theme = brandThemes[brandId];

    if (!theme) {
      console.warn(`⚠️ [MARCA BLANCA] brand_id '${brandId}' no tiene tema visual definido en brand-themes.json.`);
      return { brandTheme: null };
    }

    return { brandTheme: { ...theme, id: brandId } };

  } catch (err) {
    console.error("❌ Error en resolveBrandThemeAction:", err);
    return { brandTheme: null };
  }
}


