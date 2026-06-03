const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class {};
}

const envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ ERROR: No .env.local");
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listLeagues() {
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('id, name, invite_code, created_by');

  if (error) {
    console.error("❌ Error listing leagues:", error);
    return;
  }

  console.log(`\n📚 Total Leagues found: ${leagues.length}`);

  for (const league of leagues) {
    // Buscar perfil del creador
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', league.created_by)
      .maybeSingle();

    let brandId = 'None';
    if (profile?.email) {
      const { data: relation } = await supabase
        .from('corporate_relations')
        .select('brand_id')
        .eq('email', profile.email.trim().toLowerCase())
        .maybeSingle();
      if (relation) {
        brandId = relation.brand_id;
      }
    }

    // Contar miembros
    const { count } = await supabase
      .from('league_members')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id);

    console.log(`- League: "${league.name}" (Code: ${league.invite_code})`);
    console.log(`  Creator ID: ${league.created_by} (${profile?.email || 'No email'})`);
    console.log(`  Corporate Brand: ${brandId}`);
    console.log(`  Current Members Count: ${count || 0}`);
  }
}

listLeagues();
