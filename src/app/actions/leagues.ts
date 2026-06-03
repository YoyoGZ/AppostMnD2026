"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { requireRole } from "@/utils/auth/requireRole";

const randomNames = ["Los Galácticos", "La Scaloneta", "Escuadrón Táctico", "Los Pibes", "Leyendas del '26", "El Tercer Tiempo", "La Naranja Mecánica"];

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createLeagueAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // 1. Validar que el usuario tenga el pase (Rol: founder o super_admin)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, max_leagues')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'founder' && profile.role !== 'super_admin')) {
    return { error: "PAYWALL_REQUIRED" }; 
  }

  // 2. Regla de negocio: contar cuántas ligas ha fundado ya el usuario
  const { count: foundedCount } = await supabase
    .from('leagues')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id);

  const maxAllowed = profile.max_leagues || 0;

  if (profile.role !== 'super_admin' && (foundedCount !== null && foundedCount >= maxAllowed)) {
    return { error: "Ya fundaste todas las ligas permitidas por tus pases activos. ¡Adquiere otro Founder Pass para abrir una nueva arena!" };
  }

  let rawName = formData.get("name")?.toString()?.trim();
  let userProvidedName = !!rawName;
  let name = rawName || randomNames[Math.floor(Math.random() * randomNames.length)];

  // Verificar si el nombre de la liga ya existe (asegurar unicidad)
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    const { data: existingArena } = await supabase
      .from('leagues')
      .select('id')
      .ilike('name', name)
      .maybeSingle();
      
    if (!existingArena) {
      isUnique = true;
    } else {
      if (userProvidedName) {
        return { error: `La Liga "${name}" ya existe. ¡Elige otro nombre para diferenciarte!` };
      } else {
        // Generar un sufijo al azar si hubo colisión con el nombre autogenerado
        name = randomNames[Math.floor(Math.random() * randomNames.length)] + " " + Math.floor(Math.random() * 1000);
      }
    }
    attempts++;
  }

  if (!isUnique) {
    return { error: "Demasiados nombres en uso. Por favor ingresa uno manualmente." };
  }

  const invite_code = generateInviteCode();
  const leagueId = crypto.randomUUID();

  const { error: leagueError } = await supabase.from('leagues').insert({
    id: leagueId,
    name: name.trim(),
    invite_code,
    created_by: user.id
  });

  if (leagueError) {
    console.error("Error creando liga:", leagueError);
    return { error: "Error al crear la liga." };
  }

  const alias = user.user_metadata?.display_name || user.email?.split('@')[0] || "Fundador";
  const { error: memberError } = await supabase.from('league_members').insert({
    league_id: leagueId,
    user_id: user.id,
    alias
  });

  if (memberError) {
    console.error("Error uniendo admin:", memberError);
    return { error: "Liga creada pero falló el ingreso." };
  }

  // El rol 'founder' ya lo tiene (gracias al pago previo).
  // Solo marcamos esta liga como la activa en su metadata:

  // Establecer como liga activa en los metadatos del usuario
  await supabase.auth.updateUser({
    data: { active_league_id: leagueId }
  });

  redirect("/dashboard");
}

export async function joinLeagueAction(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // 1. Buscar liga por código (Case Insensitive)
  const { data: leagueByCode } = await supabase
    .from('leagues')
    .select('id, name, created_by')
    .ilike('invite_code', inviteCode)
    .maybeSingle();

  let league = leagueByCode;

  // 2. Fallback: buscar por nombre
  if (!league) {
    const { data: leagueByName } = await supabase
      .from('leagues')
      .select('id, name, created_by')
      .ilike('name', inviteCode)
      .maybeSingle();
    league = leagueByName;
  }

  if (!league) {
    return { error: "Liga no encontrada. Verifica el enlace de invitación." };
  }

  // 3. Validar límite de capacidad para ligas corporativas (Marca Blanca)
  const { createAdminClient } = await import("@/utils/supabase/admin");
  const adminClient = createAdminClient();

  const { data: creatorProfile } = await adminClient
    .from('profiles')
    .select('email')
    .eq('id', league.created_by)
    .maybeSingle();

  if (creatorProfile?.email) {
    const { data: relation } = await adminClient
      .from('corporate_relations')
      .select('brand_id')
      .eq('email', creatorProfile.email.trim().toLowerCase())
      .maybeSingle();

    if (relation) {
      // Contar miembros activos actuales en league_members
      const { count: memberCount } = await adminClient
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id);

      const countNum = memberCount || 0;
      if (countNum >= 10) {
        return { error: "Esta liga ha alcanzado el límite máximo de 10 participantes permitido para cuentas corporativas." };
      }
    }
  }

  // Multi-liga: verificar si ya está en ESTA liga específica (no en cualquier liga)
  const { data: alreadyInThisLeague } = await supabase
    .from('league_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('league_id', league.id)
    .maybeSingle();

  if (alreadyInThisLeague) {
    // Ya es miembro de esta liga → ir directo al dashboard
    redirect("/dashboard");
  }

  const alias = user.user_metadata?.display_name || user.email?.split('@')[0] || "Gladiador";
  const { error: joinError } = await supabase.from('league_members').insert({
    league_id: league.id,
    user_id: user.id,
    alias
  });

  if (joinError) {
    console.error("Error al unirse:", joinError);
    return { error: "Error al unirse a la liga." };
  }

  // Al unirse, la marcamos como activa automáticamente
  await supabase.auth.updateUser({
    data: { active_league_id: league.id }
  });

  redirect("/dashboard");
}

export async function getLeagueByInvite(inviteCode: string) {
  const { createAdminClient } = await import("@/utils/supabase/admin");
  const supabase = createAdminClient();
  
  console.log(`🔍 [SERVER] Consultando liga con identificador (Bypass RLS): ${inviteCode}`);
  
  // 1. Intentar por código de invitación (Case Insensitive)
  const { data: leagueByCode, error: errorByCode } = await supabase
    .from('leagues')
    .select('id, name, created_by')
    .ilike('invite_code', inviteCode)
    .maybeSingle();

  let leagueBasic = leagueByCode;

  // 2. Si no hay éxito, intentar por nombre de la liga
  if (!leagueBasic) {
    const { data: leagueByName, error: errorByName } = await supabase
      .from('leagues')
      .select('id, name, created_by')
      .ilike('name', inviteCode)
      .maybeSingle();
    
    if (errorByName) console.error("❌ [SERVER] Error buscando por nombre:", errorByName);
    leagueBasic = leagueByName;
  }

  if (!leagueBasic) {
    const finalError = errorByCode?.message || "No se encontró la Liga (¿RLS?)";
    return { error: finalError };
  }
  
  // 3. Obtener el alias del capitán
  const { data: captainMember } = await supabase
    .from('league_members')
    .select('alias')
    .eq('league_id', leagueBasic.id)
    .eq('user_id', leagueBasic.created_by)
    .single();

  // 4. Verificar si es una liga corporativa (Marca Blanca)
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', leagueBasic.created_by)
    .maybeSingle();

  let isCorporate = false;
  if (creatorProfile?.email) {
    const { data: relation } = await supabase
      .from('corporate_relations')
      .select('brand_id')
      .eq('email', creatorProfile.email.trim().toLowerCase())
      .maybeSingle();
    isCorporate = !!relation;
  }

  // 5. Contar miembros
  const { count: memberCount } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', leagueBasic.id);

  const countNum = memberCount || 0;

  return {
    id: leagueBasic.id,
    name: leagueBasic.name,
    captainAlias: captainMember?.alias || "Capitán",
    isCorporate,
    memberCount: countNum,
    isFull: isCorporate && countNum >= 10
  };
}


/**
 * Obtiene todas las ligas a las que pertenece el usuario actual.
 */
export async function getMyLeagues() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('league_members')
    .select(`
      league_id,
      leagues (
        id,
        name,
        created_by
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error("Error obteniendo mis ligas:", error);
    return [];
  }

  return (data || []).map(m => {
    const leagueData: any = m.leagues;
    // Supabase puede devolver un objeto o un array de un solo elemento
    const l = Array.isArray(leagueData) ? leagueData[0] : leagueData;
    
    return {
      id: l?.id,
      name: l?.name,
      isCaptain: l?.created_by === user.id
    };
  });
}

/**
 * Cambia la liga activa en los metadatos del usuario.
 */
export async function setActiveLeagueAction(leagueId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.auth.updateUser({
    data: { active_league_id: leagueId }
  });

  if (error) return { error: error.message };
  return { success: true };
}


/**
 * Cambia el nombre de la liga. Solo permitido para el Creador (Capitán).
 */
export async function updateLeagueNameAction(leagueId: string, newName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // 1. Validar que el usuario sea el creador de la liga
  const { data: league, error: fetchError } = await supabase
    .from('leagues')
    .select('created_by')
    .eq('id', leagueId)
    .single();

  if (fetchError || !league) return { error: "Liga no encontrada" };
  if (league.created_by !== user.id) return { error: "Solo el Capitán puede renombrar la Liga" };

  // 2. Realizar el update
  const { error: updateError } = await supabase
    .from('leagues')
    .update({ name: newName.trim() })
    .eq('id', leagueId);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

/**
 * Envía un mensaje al chat de la liga.
 */
export async function sendLeagueMessageAction(leagueId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // 1. Obtener el alias del usuario en esa liga
  const { data: member } = await supabase
    .from('league_members')
    .select('alias')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: "No eres miembro de esta liga" };

  // 2. Insertar mensaje
  const { error } = await supabase
    .from('league_messages')
    .insert({
      league_id: leagueId,
      user_id: user.id,
      sender_alias: member.alias,
      content: content.trim()
    });

  if (error) return { error: error.message };
  return { success: true };
}
