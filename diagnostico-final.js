
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xcrluwxxvyqjyhvbimyn.supabase.co';
const supabaseKey = 'sb_publishable_vhCKjGj3zNfR5E9llbO_6w_7bXuN_WP';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnostico() {
  console.log("=== INICIANDO DIAGNÓSTICO FORENSE ===");

  // 1. Ver Miembros de la Liga
  const { data: members, error: mErr } = await supabase.from('league_members').select('user_id, league_id, alias, duelos_ganados');
  if (mErr) {
    console.log("Error leyendo miembros:", mErr.message);
  } else {
    console.log(`Miembros encontrados: ${members.length}`);
    members.forEach(m => {
      console.log(`- Alias: ${m.alias} | ID: ${m.user_id} | Liga: ${m.league_id} | Ganados: ${m.duelos_ganados}`);
    });
  }

  // 2. Ver Participantes de Duelos que ganaron
  const { data: winners, error: wErr } = await supabase.from('duel_participants').select('user_id, duel_id, is_winner').eq('is_winner', true);
  if (wErr) {
    console.log("Error leyendo participantes:", wErr.message);
  } else {
    console.log(`\nVictorias registradas en duel_participants: ${winners.length}`);
    winners.forEach(w => {
      console.log(`- Ganador ID: ${w.user_id} | Duelo ID: ${w.duel_id}`);
    });
  }

  // 3. Ver Duelos
  const { data: duels, error: dErr } = await supabase.from('league_duels').select('id, league_id, status');
  if (dErr) {
    console.log("Error leyendo duelos:", dErr.message);
  } else {
    console.log(`\nDuelos totales: ${duels.length}`);
    duels.forEach(d => {
      console.log(`- Duelo ID: ${d.id} | Liga ID: ${d.league_id} | Status: ${d.status}`);
    });
  }

  console.log("\n=== FIN DEL DIAGNÓSTICO ===");
}

diagnostico();
