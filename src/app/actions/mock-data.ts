
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Leer .env.local manualmente para evitar dependencias extra
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const env: Record<string, string> = {};
envContent.split(/\r?\n/).forEach(line => {
  const [key, ...val] = line.split('=');
  if (key) env[key.trim()] = val.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function mockResults() {
  console.log("Iniciando Mock de resultados (Grupos A, B, C)...");

  const results = [
    // Grupo A
    { id: 1, home_team_id: 'MEX', away_team_id: 'RSA', home_score: 3, away_score: 1, status: 'finalizado' },
    { id: 13, home_team_id: 'KOR', away_team_id: 'CZE', home_score: 2, away_score: 2, status: 'finalizado' },
    { id: 25, home_team_id: 'MEX', away_team_id: 'KOR', home_score: 1, away_score: 0, status: 'finalizado' },
    { id: 26, home_team_id: 'CZE', away_team_id: 'RSA', home_score: 0, away_score: 2, status: 'finalizado' },
    { id: 27, home_team_id: 'CZE', away_team_id: 'MEX', home_score: 1, away_score: 4, status: 'finalizado' },
    { id: 28, home_team_id: 'RSA', away_team_id: 'KOR', home_score: 1, away_score: 1, status: 'finalizado' },
    
    // Grupo B
    { id: 2, home_team_id: 'CAN', away_team_id: 'SUI', home_score: 2, away_score: 1, status: 'finalizado' },
    { id: 14, home_team_id: 'QAT', away_team_id: 'BIH', home_score: 0, away_score: 0, status: 'finalizado' },
    { id: 29, home_team_id: 'CAN', away_team_id: 'QAT', home_score: 3, away_score: 0, status: 'finalizado' },
    { id: 30, home_team_id: 'BIH', away_team_id: 'SUI', home_score: 1, away_score: 2, status: 'finalizado' },
    
    // Grupo C
    { id: 4, home_team_id: 'BRA', away_team_id: 'MAR', home_score: 5, away_score: 0, status: 'finalizado' },
    { id: 15, home_team_id: 'SCO', away_team_id: 'HAI', home_score: 2, away_score: 2, status: 'finalizado' }
  ];

  const { error } = await supabase
    .from('match_results')
    .upsert(results, { onConflict: 'id' });

  if (error) console.error("Error inyectando mock:", error);
  else console.log("¡Mock inyectado con éxito!");
}

mockResults();
