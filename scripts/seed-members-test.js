const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Evitar error de certificados SSL en entornos locales
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Evitar error de WebSocket en Node.js < 22 (no usamos Realtime)
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class {};
}

// ====================================================================
// CONFIGURACIÓN DE LA SIEMBRA DE PRUEBA
// Edita el nombre o código de la liga de prueba corporativa:
// ====================================================================
const TARGET_LEAGUE = "Liga HYBroker"; // Nombre de la liga o código de invitación (ej: BSLJ4Z)
// ====================================================================

console.log("🚀 INICIANDO SCRIPT DE SIEMBRA DE MIEMBROS DE TEST (LÍMITE 10)...");

// 1. Cargar variables de entorno desde .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ ERROR: No se encontró el archivo .env.local en la raíz.");
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  try {
    // 2. Buscar la liga
    console.log(`🔍 Buscando liga objetivo: "${TARGET_LEAGUE}"...`);
    let { data: league, error: leagueErr } = await supabase
      .from('leagues')
      .select('id, name')
      .ilike('invite_code', TARGET_LEAGUE)
      .maybeSingle();

    if (!league) {
      const { data: leagueByName } = await supabase
        .from('leagues')
        .select('id, name')
        .ilike('name', TARGET_LEAGUE)
        .maybeSingle();
      league = leagueByName;
    }

    if (!league) {
      console.error(`❌ ERROR: No se encontró la liga: "${TARGET_LEAGUE}"`);
      process.exit(1);
    }

    console.log(`✅ Liga encontrada: "${league.name}" (ID: ${league.id})`);

    // 3. Contar miembros actuales
    const { count: currentCount } = await supabase
      .from('league_members')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id);

    const initialMembers = currentCount || 0;
    console.log(`📊 Miembros actuales en la liga: ${initialMembers}`);

    // Decidir cuántos sembrar para llegar a exactamente 10
    const toSeed = 10 - initialMembers;
    if (toSeed <= 0) {
      console.log("ℹ️ La liga ya tiene 10 o más miembros. No se requiere siembra.");
      process.exit(0);
    }
    
    console.log(`🌱 Sembrando exactamente ${toSeed} perfiles de prueba para llegar a 10...`);


    for (let i = 1; i <= toSeed; i++) {
      const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const mockEmail = `gladiador_${i}_${uniqueSuffix}@testapp26.com`;
      const mockAlias = `Gladiador_${i}_${uniqueSuffix}`;
      const mockPassword = "ClaveDeTest123!";

      console.log(`\n👉 Sembrando [${i}/${toSeed}] - ${mockAlias} (${mockEmail})...`);

      // A. Crear usuario en Auth
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: mockEmail,
        password: mockPassword,
        email_confirm: true,
        user_metadata: {
          display_name: mockAlias,
          active_league_id: league.id,
          welcome_sorteo_shown: true
        }
      });

      if (authErr) {
        console.error(`   ❌ Error en Auth para ${mockAlias}:`, authErr.message);
        continue;
      }

      const userId = authData.user.id;

      // B. Crear perfil
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: mockEmail,
          display_name: mockAlias,
          role: 'member'
        });

      if (profileErr) {
        console.warn(`   ⚠️ Advertencia en profiles para ${mockAlias}:`, profileErr.message);
      }

      // C. Insertar membresía
      const { error: memberErr } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: userId,
          alias: mockAlias
        });

      if (memberErr) {
        console.error(`   ❌ Error al unirse a liga para ${mockAlias}:`, memberErr.message);
        // Deshacer usuario si falla unión
        await supabase.auth.admin.deleteUser(userId);
      } else {
        console.log(`   ✅ Sembrado exitosamente.`);
      }
    }

    // 4. Mostrar balance final
    const { count: finalCount } = await supabase
      .from('league_members')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id);

    console.log("\n==============================================================");
    console.log("🎉 SIEMBRA CONCLUIDA");
    console.log(`   Miembros Iniciales: ${initialMembers}`);
    console.log(`   Miembros Sembrados con éxito: ${finalCount - initialMembers}`);
    console.log(`   Miembros Finales en la Liga: ${finalCount}`);
    console.log("==============================================================\n");

  } catch (err) {
    console.error("❌ ERROR CRÍTICO durante la siembra:", err);
  }
}

run();
