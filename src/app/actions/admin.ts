"use server";

import { createClient } from "@/utils/supabase/server";
import { requireRole } from "@/utils/auth/requireRole";

export async function generateTokensAction(quantity: number) {
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const inserts = Array.from({ length: quantity }).map(() => ({
    created_by: user!.id,
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
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();

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
  try {
    await requireRole('super_admin');
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('access_tokens')
    .delete()
    .eq('id', tokenId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
