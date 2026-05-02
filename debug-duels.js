const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Leer .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debug() {
  console.log("=== DUELS ===");
  const { data: duels, error: e1 } = await supabase.from('league_duels').select('*');
  console.log(JSON.stringify(duels, null, 2));
  if (e1) console.log("ERR:", e1.message);

  console.log("\n=== PARTICIPANTS ===");
  const { data: parts, error: e2 } = await supabase.from('duel_participants').select('*');
  console.log(JSON.stringify(parts, null, 2));
  if (e2) console.log("ERR:", e2.message);

  console.log("\n=== PREDS match_id='1' ===");
  const { data: p1 } = await supabase.from('predictions').select('id, match_id, user_id, points_earned').eq('match_id', '1');
  console.log(JSON.stringify(p1, null, 2));

  console.log("\n=== PREDS match_id=1 (number) ===");
  const { data: p2 } = await supabase.from('predictions').select('id, match_id, user_id, points_earned').eq('match_id', 1);
  console.log(JSON.stringify(p2, null, 2));
}

debug();
