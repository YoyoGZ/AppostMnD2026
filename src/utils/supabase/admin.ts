import { createClient } from '@supabase/supabase-js'

/**
 * Cliente administrativo de Supabase.
 * bypasses RLS - Usar solo en el servidor para tareas de sistema.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceKey) {
    console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no encontrada en las variables de entorno.");
    throw new Error("Configuración administrativa de Supabase ausente");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
