const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Cargar .env.local manualmente
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = {};

if (fs.existsSync(envPath)) {
  const envFileContent = fs.readFileSync(envPath, 'utf8');
  envFileContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      envConfig[key] = val;
    }
  });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error("❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

// Crear cliente con privilegios de service role (Admin)
const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSeed() {
  console.log("🌱 Iniciando sembrado de relaciones corporativas y CUENTAS DE USUARIO en Supabase Auth...");

  // Modificamos el rol de 'player' a 'member' de acuerdo al check constraint de profiles
  const testUsers = [
    { email: 'test.founder@globant.com', password: 'globant26', brandId: 'globant', role: 'founder' },
    { email: 'test@globant.com', password: 'globant26', brandId: 'globant', role: 'member' },
    { email: 'test.member@globant.com', password: 'globant26', brandId: 'globant', role: 'member' }
  ];

  for (const u of testUsers) {
    const emailLower = u.email.trim().toLowerCase();
    
    // 1. Verificar si el usuario ya existe en Supabase Auth
    console.log(`\n🔍 Buscando cuenta de autenticación para: ${emailLower}...`);
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error("❌ Error al listar usuarios de Supabase Auth:", listError.message);
      continue;
    }

    const existingUser = users.find(user => user.email.toLowerCase() === emailLower);

    let authUser = null;

    if (existingUser) {
      console.log(`⚠️ El usuario ${emailLower} ya existe en Supabase Auth (ID: ${existingUser.id}). Actualizando contraseña...`);
      // Actualizar contraseña a globant26 para estar seguros
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: u.password, email_confirm: true }
      );

      if (updateError) {
        console.error(`❌ Error al actualizar contraseña de ${emailLower}:`, updateError.message);
      } else {
        console.log(`✅ Contraseña de ${emailLower} actualizada a "${u.password}".`);
        authUser = updateData.user;
      }
    } else {
      console.log(`➕ Creando nueva cuenta de autenticación para ${emailLower}...`);
      // Crear nueva cuenta
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: emailLower,
        password: u.password,
        email_confirm: true
      });

      if (createError) {
        console.error(`❌ Error al crear usuario ${emailLower}:`, createError.message);
      } else {
        console.log(`✅ Cuenta de autenticación creada con éxito para ${emailLower} con clave "${u.password}".`);
        authUser = createData.user;
      }
    }

    const targetUserId = existingUser ? existingUser.id : (authUser ? authUser.id : null);

    // 2. Asegurar que esté en la tabla corporate_relations
    console.log(`🏢 Vinculando en corporate_relations: ${emailLower} -> ${u.brandId}...`);
    const { error: relError } = await supabase
      .from('corporate_relations')
      .upsert({ email: emailLower, brand_id: u.brandId }, { onConflict: 'email' });

    if (relError) {
      console.error(`❌ Error al registrar en corporate_relations:`, relError.message);
    } else {
      console.log(`✅ Registro en corporate_relations exitoso.`);
    }

    // 3. Si el usuario existe en auth.users, forzar/actualizar su perfil en la tabla profiles
    if (targetUserId) {
      console.log(`👤 Asegurando perfil en la tabla profiles para ID: ${targetUserId}...`);
      
      // Intentar ver si existe el perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profile) {
        // Si ya existe el perfil, forzamos su rol (especialmente 'founder' para el founder)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: u.role, email: emailLower })
          .eq('id', targetUserId);

        if (profileError) {
          console.error(`❌ Error al actualizar rol en profiles:`, profileError.message);
        } else {
          console.log(`✅ Perfil actualizado en profiles con rol "${u.role}".`);
        }
      } else {
        // Insertar el perfil manualmente si el trigger no se ejecutó
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: targetUserId,
            email: emailLower,
            username: emailLower.split('@')[0],
            role: u.role
          });

        if (profileError) {
          console.error(`❌ Error al insertar perfil en profiles:`, profileError.message);
        } else {
          console.log(`✅ Perfil insertado manualmente en profiles con rol "${u.role}".`);
        }
      }
    }
  }

  console.log("\n🏁 Proceso de sembrado y registro completo.");
}

runSeed();
