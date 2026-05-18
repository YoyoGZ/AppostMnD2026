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

  // MOCK: Ascender a founder en la base de datos saltando el escudo RLS
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'founder' })
    .eq('id', user.id);

  if (error) {
    console.error("Error en mockPayment:", error);
    return { error: "Fallo al simular el pago" };
  }

  // Devolver éxito para que el cliente haga el redirect
  return { success: true };
}

export async function createPaymentPreferenceAction(leagueName: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesión no encontrada. Por favor volvé a ingresar." };
    }

    // URL Base exclusiva para Producción en Vercel
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://mundial2026.vercel.app'; // Fallback estricto a Vercel

    // Crear la preferencia de pago
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'founder_pass_2026',
            title: `Founder Pass - Liga ${leagueName}`,
            description: "Licencia de Plataforma - Mundial 2026",
            quantity: 1,
            unit_price: 50000, // VALOR OFICIAL FINAL DE LA FRANQUICIA ($50.000 ARS)
            currency_id: "ARS",
          }
        ],
        // MUY IMPORTANTE: La metadata oculta que Mercado Pago nos devolverá en el Webhook
        metadata: {
          league_name: leagueName, // Para poder crearla o activarla
          user_id: user.id
        },
        back_urls: {
          // A donde va el usuario DESPUÉS de pagar
          success: `${baseUrl}/api/callbacks/mp-success?league=${encodeURIComponent(leagueName)}`,
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
