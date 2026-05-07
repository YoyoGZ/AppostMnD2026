
import { createClient } from '@supabase/supabase-js';
// Tip: Si corres este script manualmente, usa: npx tsx --env-file=.env.local scratch/diag-db.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function diag() {
  console.log("--- Diagnóstico de DB ---");
  
  // 1. Verificar estructura de match_results
  const { data: sample, error } = await supabase
    .from('match_results')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error leyendo match_results:", error);
  } else {
    console.log("Muestra de match_results:", sample);
    if (sample && sample.length > 0) {
        console.log("Tipo de ID:", typeof sample[0].id);
    }
  }

  // 2. Buscar específicamente el partido de Octavos (KO-16-89)
  const { data: knockout, error: kError } = await supabase
    .from('match_results')
    .select('*')
    .eq('id', 'KO-16-89');

  if (kError) {
    console.error("Error buscando KO-16-89:", kError);
  } else {
    console.log("Resultado para KO-16-89:", knockout);
  }
}

diag();
