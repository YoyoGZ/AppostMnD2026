"use server";

import { createClient } from "@/utils/supabase/server";

export async function burnVipTokenAction(tokenStr: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuario no autenticado" };

  // 1. Quemar el token de forma atómica
  const { data: updatedToken, error } = await supabase
    .from('access_tokens')
    .update({ 
      is_used: true, 
      used_by: user.id, 
      consumed_at: new Date().toISOString() 
    })
    .eq('token', tokenStr)
    .eq('is_used', false) // Crítico: Previene race conditions
    .select('id')
    .maybeSingle();

  if (error || !updatedToken) {
    return { success: false, error: "El pase ya fue consumido por alguien más o hubo un error." };
  }

  return { success: true };
}
