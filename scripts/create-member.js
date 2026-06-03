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
// CONFIGURACIÓN DEL MIEMBRO A INTEGRAR
// Edita los valores entre comillas según tus necesidades de prueba:
// ====================================================================
const CONFIG = {
  email: "chicho@mail.com",    // Email del nuevo usuario
  alias: "MauroComilonazo",                 // Apodo/Alias del usuario en la liga
  password: "chicho2026",           // Contraseña del nuevo usuario (mínimo 6 caracteres)
  leagueNameOrCode: "Chicho sos cagon"        // Nombre de la Liga o Código de Invitación (ej: BSLJ4Z)
};
// ====================================================================

console.log("🚀 INICIANDO SCRIPT DE APROVISIONAMIENTO DE MIEMBRO...");

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
    // 3. Buscar la liga por código o nombre
    console.log(`🔍 Buscando liga por identificador: "${CONFIG.leagueNameOrCode}"...`);
    let { data: league, error: leagueErr } = await supabase
      .from('leagues')
      .select('id, name')
      .ilike('invite_code', CONFIG.leagueNameOrCode)
      .maybeSingle();

    if (leagueErr) {
      console.error("❌ Error al buscar liga por código:", leagueErr);
      process.exit(1);
    }

    if (!league) {
      // Intentar buscar por nombre
      const { data: leagueByName, error: nameErr } = await supabase
        .from('leagues')
        .select('id, name')
        .ilike('name', CONFIG.leagueNameOrCode)
        .maybeSingle();

      if (nameErr) {
        console.error("❌ Error al buscar liga por nombre:", nameErr);
        process.exit(1);
      }
      league = leagueByName;
    }

    if (!league) {
      console.error(`❌ ERROR: No se encontró ninguna liga que coincida con el nombre o código: "${CONFIG.leagueNameOrCode}"`);
      process.exit(1);
    }

    console.log(`✅ Liga encontrada: "${league.name}" (ID: ${league.id})`);

    // 4. Crear usuario en Supabase Auth con metadatos de liga activa y visto del sorteo
    console.log(`👤 Creando usuario de autenticación para: ${CONFIG.email}...`);
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: CONFIG.email,
      password: CONFIG.password,
      email_confirm: true,
      user_metadata: {
        display_name: CONFIG.alias,
        active_league_id: league.id,
        welcome_sorteo_shown: true // Saltearse el popup de bienvenida/sorteo en el primer login
      }
    });

    if (authErr) {
      console.error("❌ ERROR al crear usuario en Supabase Auth:", authErr.message);
      process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✅ Usuario creado en Auth con ID único: ${userId}`);

    // 5. Configurar el perfil en public.profiles (upsert por si el trigger ya lo creó)
    console.log("⚙️ Configurando perfil del usuario en la tabla profiles...");
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: CONFIG.email,
        display_name: CONFIG.alias,
        role: 'member' // Rol normal de miembro
      });

    if (profileErr) {
      console.warn("⚠️ Advertencia al actualizar tabla profiles:", profileErr.message);
    } else {
      console.log("✅ Perfil guardado exitosamente en profiles.");
    }

    // 6. Insertar la membresía en la tabla league_members
    console.log(`⚔️ Integrando a ${CONFIG.alias} a la liga "${league.name}"...`);
    const { error: memberErr } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: userId,
        alias: CONFIG.alias
      });

    if (memberErr) {
      console.error("❌ ERROR al insertar en league_members:", memberErr.message);
      // Opcional: borrar el auth user si falla la membresía para permitir reintentar
      await supabase.auth.admin.deleteUser(userId);
      process.exit(1);
    }

    console.log("\n====================================================================");
    console.log("🎉 ¡APROVISIONAMIENTO COMPLETADO CON ÉXITO!");
    console.log(`   📧 Email: ${CONFIG.email}`);
    console.log(`   👤 Alias: ${CONFIG.alias}`);
    console.log(`   🔑 Clave: ${CONFIG.password}`);
    console.log(`   🏢 Liga Integrada: "${league.name}"`);
    console.log("====================================================================\n");
    console.log("💡 Ya podés iniciar sesión directamente en la aplicación web.");
    console.log("   Se omitirá el onboarding y entrará directo al Dashboard de la liga.");

  } catch (err) {
    console.error("❌ ERROR CRÍTICO durante el aprovisionamiento:", err);
  }
}

run();
