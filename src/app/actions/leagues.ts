"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const randomNames = ["Los Galácticos", "La Scaloneta", "Escuadrón Táctico", "Los Pibes", "Leyendas del '26", "El Tercer Tiempo", "La Naranja Mecánica"];

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createLeagueAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  let name = formData.get("name")?.toString();
  if (!name || name.trim() === "") {
    name = randomNames[Math.floor(Math.random() * randomNames.length)];
  }

  const invite_code = generateInviteCode();
  const leagueId = crypto.randomUUID(); // Necesita ser compatible con UUID en Postgres

  const { error: leagueError } = await supabase.from('leagues').insert({
    id: leagueId,
    name: name.trim(),
    invite_code,
    created_by: user.id
  });

  if (leagueError) {
    console.error("Error creando liga:", leagueError);
    return { error: "Error al crear la arena." };
  }

  const { error: memberError } = await supabase.from('league_members').insert({
    league_id: leagueId,
    user_id: user.id,
    alias: user.email?.split('@')[0] || "Fundador"
  });

  if (memberError) {
    console.error("Error uniendo admin:", memberError);
    return { error: "Arena creada pero falló el ingreso." };
  }

  redirect("/dashboard");
}

export async function joinLeagueAction(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // 1. Buscar por código (Case Insensitive)
  const { data: leagueByCode } = await supabase
    .from('leagues')
    .select('id, name')
    .ilike('invite_code', inviteCode)
    .maybeSingle();

  let league = leagueByCode;

  // 2. Si no hay por código, buscar por nombre
  if (!league) {
    const { data: leagueByName } = await supabase
      .from('leagues')
      .select('id, name')
      .ilike('name', inviteCode)
      .maybeSingle();
    league = leagueByName;
  }

  if (!league) {
    return { error: "Arena no encontrada. Verifica el enlace de invitación." };
  }

  // Verificar cupos (Máximo 10)
  const { count, error: countError } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', league.id);

  if (count !== null && count >= 10) {
    return { error: "Esta Arena ya alcanzó el límite de 10 gladiadores." };
  }

  // Check if already in
  const { data: alreadyIn } = await supabase
    .from('league_members')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (alreadyIn) {
    // Si ya está en una liga, en un MVP tal vez lo redirigimos directo o le damos error
    redirect("/dashboard");
  }

  const { error: joinError } = await supabase.from('league_members').insert({
    league_id: league.id,
    user_id: user.id,
    alias: user.email?.split('@')[0] || "Gladiador"
  });

  if (joinError) {
    return { error: "Error al unirse a la arena." };
  }

  redirect(`/standings?invite=${inviteCode}`);
}

export async function getLeagueByInvite(inviteCode: string) {
  const supabase = await createClient();
  
  console.log(`🔍 [SERVER] Consultando liga con identificador: ${inviteCode}`);
  
  // 1. Intentar por código de invitación (Case Insensitive)
  const { data: leagueByCode, error: errorByCode } = await supabase
    .from('leagues')
    .select('id, name, created_by')
    .ilike('invite_code', inviteCode)
    .maybeSingle();

  let leagueBasic = leagueByCode;

  // 2. Si no hay éxito, intentar por nombre de la arena
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
    const finalError = errorByCode?.message || "No se encontró la Arena (¿RLS?)";
    return { error: finalError };
  }
  
  // 2. Obtener el alias del capitán
  const { data: captainMember } = await supabase
    .from('league_members')
    .select('alias')
    .eq('league_id', leagueBasic.id)
    .eq('user_id', leagueBasic.created_by)
    .single();

  return {
    id: leagueBasic.id,
    name: leagueBasic.name,
    captainAlias: captainMember?.alias || "Capitán"
  };
}

