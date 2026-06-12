const fs = require('fs');
const path = require('path');

// Evitar error de certificados SSL en entornos locales
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Evitar error de WebSocket en Node.js < 22 (no usamos Realtime en este script)
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class {};
}

const { createClient } = require('@supabase/supabase-js');

// ====================================================================
// CONFIGURACIÓN DE LOS MIEMBROS A INTEGRAR
// - Podés registrar un solo miembro dejando un único objeto en la lista.
// - Si querés registrar varios de una vez, podés copiar y pegar más objetos
//   adentro del array 'members' (separados por coma).
// ====================================================================
const CONFIG = {
  leagueNameOrCode: "Patines FC", // Nombre o código de la liga a la que querés que entren o a crear
  members: [
    {
      email: "Chicho2@mail.com",
      alias: "Chicho",
      password: "chicho2026",
      role: "member" // Rol de fundador
    }
  ]
};
// ====================================================================

console.log("🚀 INICIANDO SCRIPT DE APROVISIONAMIENTO DE MIEMBROS...");

// 1. Cargar variables de entorno desde .env.local de la raíz
const envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ ERROR: No se encontró el archivo .env.local en la raíz del proyecto.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value.trim();
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontradas en .env.local.");
  process.exit(1);
}

// 2. Inicializar cliente administrativo de Supabase (Bypassea RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  try {
    const identifier = CONFIG.leagueNameOrCode.trim();
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);
    
    console.log(`🔍 Buscando liga por identificador: "${identifier}"...`);
    let league = null;

    if (isUUID) {
      const { data, error } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('id', identifier)
        .maybeSingle();
      if (error) {
        console.error("❌ Error al buscar liga por UUID:", error);
        process.exit(1);
      }
      league = data;
    } else {
      // Intentar buscar por invite_code
      const { data: byCode, error: codeErr } = await supabase
        .from('leagues')
        .select('id, name')
        .ilike('invite_code', identifier)
        .maybeSingle();

      if (codeErr) {
        console.error("❌ Error al buscar liga por código de invitación:", codeErr);
        process.exit(1);
      }
      league = byCode;

      if (!league) {
        // Intentar buscar por name (coincidencia insensible a mayúsculas)
        const { data: byName, error: nameErr } = await supabase
          .from('leagues')
          .select('id, name')
          .ilike('name', identifier)
          .maybeSingle();

        if (nameErr) {
          console.error("❌ Error al buscar liga por nombre:", nameErr);
          process.exit(1);
        }
        league = byName;
      }
    }

    if (league) {
      console.log(`✅ Liga encontrada: "${league.name}" (ID: ${league.id})`);
    } else {
      console.log(`⚠️ Liga "${identifier}" no encontrada en la base de datos.`);
    }

    // 4. Recorrer los miembros a registrar
    for (const member of CONFIG.members) {
      console.log(`\n👤 Procesando miembro: ${member.email} (${member.alias})...`);

      // Crear usuario en Supabase Auth
      console.log(`   Creando usuario de autenticación en Auth...`);
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: member.email,
        password: member.password,
        email_confirm: true,
        user_metadata: {
          display_name: member.alias,
          welcome_sorteo_shown: true
        }
      });

      if (authErr) {
        console.error(`   ❌ ERROR al crear usuario en Supabase Auth:`, authErr.message);
        continue;
      }

      const userId = authData.user.id;
      console.log(`   ✅ Usuario creado en Auth con ID único: ${userId}`);

      // Configurar el perfil en public.profiles (con el rol asignado)
      const userRole = member.role || 'member';
      console.log(`   Configurando perfil del usuario en la tabla profiles con rol "${userRole}"...`);
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: member.email,
          display_name: member.alias,
          role: userRole
        });

      if (profileErr) {
        console.warn("   ⚠️ Advertencia al actualizar tabla profiles:", profileErr.message);
      } else {
        console.log("   ✅ Perfil guardado exitosamente en profiles.");
      }

      // Si la liga no existía y el rol es 'founder', la creamos ahora con este usuario
      let targetLeagueId = league?.id;
      if (!targetLeagueId) {
        if (userRole === 'founder') {
          console.log(`   ➕ Creando liga "${identifier}" asociada a este fundador...`);
          const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { data: newLeague, error: newLeagueErr } = await supabase
            .from('leagues')
            .insert({
              name: identifier,
              invite_code: inviteCode,
              created_by: userId
            })
            .select('id, name')
            .single();

          if (newLeagueErr) {
            console.error("   ❌ ERROR al crear liga:", newLeagueErr.message);
            await supabase.auth.admin.deleteUser(userId);
            continue;
          }

          console.log(`   ✅ Liga "${newLeague.name}" creada exitosamente con código "${inviteCode}" (ID: ${newLeague.id})`);
          targetLeagueId = newLeague.id;
          league = newLeague;
        } else {
          console.error(`   ❌ ERROR: No se puede asociar el usuario a la liga porque no existe y el rol no es 'founder'.`);
          await supabase.auth.admin.deleteUser(userId);
          continue;
        }
      }

      // Insertar la membresía en la tabla league_members
      console.log(`   ⚔️ Integrando a ${member.alias} a la liga "${league.name}"...`);
      const { error: memberErr } = await supabase
        .from('league_members')
        .insert({
          league_id: targetLeagueId,
          user_id: userId,
          alias: member.alias
        });

      if (memberErr) {
        console.error("   ❌ ERROR al insertar en league_members:", memberErr.message);
        await supabase.auth.admin.deleteUser(userId);
        continue;
      }

      // Actualizar el active_league_id del usuario en Auth metadatos para que inicie en esa liga
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          display_name: member.alias,
          active_league_id: targetLeagueId,
          welcome_sorteo_shown: true
        }
      });

      console.log("   🎉 ¡APROVISIONAMIENTO COMPLETADO CON ÉXITO!");
    }

    console.log("\n====================================================================");
    console.log("🏁 Proceso de aprovisionamiento finalizado.");
    console.log("====================================================================\n");

  } catch (err) {
    console.error("❌ ERROR CRÍTICO durante el aprovisionamiento:", err);
  }
}

run();
