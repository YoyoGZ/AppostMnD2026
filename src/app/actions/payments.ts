"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";

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
