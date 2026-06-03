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
  leagueNameOrCode: "da41c54b-fc20-4129-a89d-52a438ed1441", // Nombre o código de la liga a la que querés que entren
  members: [
    {
      email: "chicho@mail.com",    // Cambiá este email
      alias: "Chichooo",                 // Cambiá este apodo
      password: "chicho2026"            // Cambiá la clave (mínimo 6 caracteres)
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
    // 3. Buscar la liga por UUID, código o nombre
    const identifier = CONFIG.leagueNameOrCode.trim();
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);
    
    console.log(`🔍 Buscando liga por identificador: "${identifier}"...`);
    let league = null;

    if (isUUID) {
      console.log("   [INFO] Detectado formato UUID. Buscando directamente por ID de liga...");
      const { dataByUUID, error: uuidErr } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('id', identifier)
        .maybeSingle();

      if (uuidErr) {
        console.error("❌ Error al buscar liga por UUID:", uuidErr);
        process.exit(1);
      }
      // NOTA: supabase retorna dataByUUID en variables locales si cambiamos el desestructurado
    }

    // Buscador general secuencial
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

    if (!league) {
      console.error(`\n❌ ERROR: No se encontró ninguna liga en la base de datos con: "${identifier}"`);
      console.error("💡 TIP 1: Si buscás por nombre y tiene acentos (ej: 'Campeón'), la consola puede corromper el caracter. Probá usando el Código de Invitación alfanumérico (ej: '014NW2') que no tiene acentos ni espacios.");
      console.error("💡 TIP 2: Si usás el UUID, asegurate de que sea el valor exacto de la columna 'id' de la tabla 'leagues'.\n");
      process.exit(1);
    }

    console.log(`✅ Liga encontrada: "${league.name}" (ID: ${league.id})`);

    // 4. Recorrer los miembros a registrar
    for (const member of CONFIG.members) {
      console.log(`\n👤 Procesando miembro: ${member.email} (${member.alias})...`);

      // Crear usuario en Supabase Auth con metadatos de liga activa y visto del sorteo
      console.log(`   Creando usuario de autenticación en Auth...`);
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: member.email,
        password: member.password,
        email_confirm: true,
        user_metadata: {
          display_name: member.alias,
          active_league_id: league.id,
          welcome_sorteo_shown: true // Saltearse el popup de bienvenida/sorteo en el primer login
        }
      });

      if (authErr) {
        console.error(`   ❌ ERROR al crear usuario en Supabase Auth:`, authErr.message);
        continue; // Seguir con el siguiente si hay error
      }

      const userId = authData.user.id;
      console.log(`   ✅ Usuario creado en Auth con ID único: ${userId}`);

      // Configurar el perfil en public.profiles (upsert por si el trigger ya lo creó)
      console.log("   Configurando perfil del usuario en la tabla profiles...");
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: member.email,
          display_name: member.alias,
          role: 'member' // Rol normal de miembro
        });

      if (profileErr) {
        console.warn("   ⚠️ Advertencia al actualizar tabla profiles:", profileErr.message);
      } else {
        console.log("   ✅ Perfil guardado exitosamente en profiles.");
      }

      // Insertar la membresía en la tabla league_members
      console.log(`   ⚔️ Integrando a ${member.alias} a la liga "${league.name}"...`);
      const { error: memberErr } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: userId,
          alias: member.alias
        });

      if (memberErr) {
        console.error("   ❌ ERROR al insertar en league_members:", memberErr.message);
        // Borrar el auth user si falla la membresía para mantener consistencia
        await supabase.auth.admin.deleteUser(userId);
        continue;
      }

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
