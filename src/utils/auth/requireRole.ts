import { createClient } from "@/utils/supabase/server";

type Role = 'member' | 'founder' | 'super_admin';

const ROLE_HIERARCHY: Record<Role, number> = {
  member: 1,
  founder: 2,
  super_admin: 3,
};

/**
 * Shield Guard — verifica autenticación y rol mínimo requerido.
 * Fuente de verdad: tabla `profiles` en Supabase (no el JWT).
 * 
 * @throws Error si no está autenticado o el rol no alcanza.
 * @returns { user, profile } si la verificación es exitosa.
 */
export async function requireRole(minRole: Role = 'member') {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("SHIELD_UNAUTHORIZED: No autenticado.");
  }

  // Consultar la fuente de verdad: tabla profiles (no user_metadata del JWT)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, display_name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("SHIELD_NO_PROFILE: Perfil no encontrado.");
  }

  const userLevel = ROLE_HIERARCHY[profile.role as Role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole];

  if (userLevel < requiredLevel) {
    throw new Error(`SHIELD_FORBIDDEN: Se requiere rol '${minRole}'. Rol actual: '${profile.role}'.`);
  }

  return { user, profile };
}

/**
 * Versión segura de requireRole que NO lanza excepción.
 * Devuelve null si no tiene el nivel de acceso necesario.
 */
export async function checkRole(minRole: Role = 'member') {
  try {
    return await requireRole(minRole);
  } catch {
    return null;
  }
}
