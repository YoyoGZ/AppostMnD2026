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

  const { data: league, error: findError } = await supabase
    .from('leagues')
    .select('id, name')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (findError || !league) {
    return { error: "Código de invitación inválido o caducado." };
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

  redirect("/dashboard");
}
