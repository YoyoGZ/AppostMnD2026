"use server";

import { createClient } from "@/utils/supabase/server";

export async function generateTokensAction(quantity: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'super_admin') {
    return { success: false, error: "No autorizado" };
  }

  // Crear array de inserciones
  const inserts = Array.from({ length: quantity }).map(() => ({
    created_by: user.id,
  }));

  const { data, error } = await supabase
    .from('access_tokens')
    .insert(inserts)
    .select('id, token, created_at');

  if (error) {
    console.error("Error generando tokens:", error);
    return { success: false, error: error.message };
  }

  return { success: true, tokens: data };
}

export async function fetchTokensAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'super_admin') {
    return { success: false, error: "No autorizado" };
  }

  const { data, error } = await supabase
    .from('access_tokens')
    .select('id, token, is_used, consumed_at, created_at, used_by')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, tokens: data };
}

export async function deleteTokenAction(tokenId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'super_admin') {
    return { success: false, error: "No autorizado" };
  }

  const { error } = await supabase
    .from('access_tokens')
    .delete()
    .eq('id', tokenId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
