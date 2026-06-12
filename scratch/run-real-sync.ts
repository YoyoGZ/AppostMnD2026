process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
(global as any).WebSocket = class {} as any;

import fs from 'fs';
import path from 'path';

// Leer las credenciales de .env.local
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
process.env.API_FOOTBALL_KEY = env.API_FOOTBALL_KEY;

async function main() {
  console.log("Cargadas variables. Importando SportsSyncAgent dinámicamente...");
  // Importación dinámica para evitar el hoisting de ES6
  const { sportsSyncAgent } = await import("../src/services/SportsSyncAgent");

  console.log("Iniciando sincronización real con la base de datos de Supabase...");
  console.log("Clave de API en ejecución:", process.env.API_FOOTBALL_KEY);
  
  console.log("Iniciando sincronización real del fixture del 1 al 72 con Supabase...");
  const fixtureIds = Array.from({ length: 72 }, (_, i) => i + 1);
  const res = await sportsSyncAgent.syncMatchesToDatabase(fixtureIds);
  console.log("Resultado de la sincronización en Supabase:");
  console.log(res);
}

main().catch(err => console.error("Error:", err));
