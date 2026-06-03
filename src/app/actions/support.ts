"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireRole } from "@/utils/auth/requireRole";

export interface SupportTicket {
  id: string;
  user_id?: string | null;
  email: string;
  alias: string;
  message: string;
  status: string;
  created_at: string;
}

/**
 * Crea un ticket de soporte/contacto en Supabase
 * Puede ser invocado por usuarios anónimos o autenticados
 */
export async function createSupportTicketAction(
  email: string,
  alias: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!email || email.trim().length === 0) {
    return { success: false, error: "El email es obligatorio." };
  }
  if (!alias || alias.trim().length === 0) {
    return { success: false, error: "El nombre o alias es obligatorio." };
  }
  if (!message || message.trim().length === 0) {
    return { success: false, error: "La consulta no puede estar vacía." };
  }

  try {
    const supabase = await createClient();

    // Intentar obtener usuario logueado para trazar su ID
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const userId = user?.id || null;

    const { error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userId,
        email: email.trim(),
        alias: alias.trim(),
        message: message.trim(),
        status: "open"
      });

    if (error) {
      console.error("❌ Error al insertar ticket de soporte:", error);
      return { success: false, error: "Error de servidor al guardar tu consulta." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("❌ Error inesperado en createSupportTicketAction:", err);
    return { success: false, error: err.message || "Error inesperado de red." };
  }
}

/**
 * Obtiene todos los tickets de soporte (Requiere rol super_admin)
 */
export async function getSupportTicketsAction(): Promise<{
  success: boolean;
  tickets?: SupportTicket[];
  error?: string;
}> {
  try {
    await requireRole("super_admin");
  } catch {
    return { success: false, error: "No autorizado." };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener tickets de soporte:", error);
      return { success: false, error: "Error al consultar los tickets de soporte." };
    }

    return { success: true, tickets: data || [] };
  } catch (err: any) {
    console.error("❌ Error en getSupportTicketsAction:", err);
    return { success: false, error: err.message || "Error de red al consultar el HQ." };
  }
}

/**
 * Actualiza el estado de un ticket de soporte (Requiere rol super_admin)
 */
export async function updateSupportTicketStatusAction(
  id: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole("super_admin");
  } catch {
    return { success: false, error: "No autorizado." };
  }

  if (!id || !status) {
    return { success: false, error: "Identificador y estado requeridos." };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from("support_tickets")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("❌ Error al actualizar estado del ticket:", error);
      return { success: false, error: "Error al actualizar el ticket de soporte." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("❌ Error en updateSupportTicketStatusAction:", err);
    return { success: false, error: err.message || "Error de red al modificar el ticket." };
  }
}
