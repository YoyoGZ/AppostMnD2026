/**
 * SCRIPT DE DIAGNÓSTICO: COBERTURA MUNDIAPP26
 * 
 * Este script verifica si API-Football tiene los datos del MundiApp26.
 */

const API_KEY = "2672e54b9659d01a9d41a50005dc6849"; // Reemplazar con la key real
const API_HOST = "v3.football.api-sports.io";

async function checkCoverage() {
  console.log("🚀 Iniciando auditoría de cobertura para MundiApp26...");

  const headers = {
    "x-rapidapi-host": API_HOST,
    "x-rapidapi-key": API_KEY
  };

  try {
    // 1. Buscar la Liga "World Cup"
    console.log("\n--- Paso 1: Buscando League ID para 'World Cup' ---");
    const leagueResponse = await fetch(`https://${API_HOST}/leagues?search=World Cup`, { headers });
    const leagueData = await leagueResponse.json();

    if (!leagueData.response || leagueData.response.length === 0) {
      console.error("❌ No se encontró ninguna liga que coincida con 'World Cup'.");
      return;
    }

    // Filtrar ligas que sean el Mundial de la FIFA (normalmente ID: 1)
    const worldCups = leagueData.response.filter((l: any) => 
      l.league.name === "World Cup" && l.league.type === "Cup"
    );

    console.log(`✅ Se encontraron ${worldCups.length} variantes de 'World Cup'.`);
    
    for (const wc of worldCups) {
      const id = wc.league.id;
      const name = wc.league.name;
      console.log(`\nID: ${id} | Nombre: ${name}`);
      
      // Ver si tiene temporada 2026
      const season2026 = wc.seasons.find((s: any) => s.year === 2026);
      if (season2026) {
        console.log(`   ✨ ¡TEMPORADA 2026 DETECTADA!`);
        console.log(`   📅 Inicio: ${season2026.start} | Fin: ${season2026.end}`);
        console.log(`   📊 Cobertura: Standings: ${season2026.coverage.standings}, Fixtures: ${season2026.coverage.fixtures.events}`);
        
        // 2. Intentar traer partidos de 2026
        console.log(`\n--- Paso 2: Verificando Fixtures para ID ${id} (2026) ---`);
        const fixtureResponse = await fetch(`https://${API_HOST}/fixtures?league=${id}&season=2026`, { headers });
        const fixtureData = await fixtureResponse.json();
        
        if (fixtureData.response && fixtureData.response.length > 0) {
          console.log(`   ✅ ¡ÉXITO! Se encontraron ${fixtureData.response.length} partidos programados.`);
          console.log(`   📝 Ejemplo primer partido: ${fixtureData.response[0].teams.home.name} vs ${fixtureData.response[0].teams.away.name}`);
        } else {
          console.log(`   ⚠️  La temporada existe pero aún no hay partidos cargados.`);
        }
      } else {
        console.log(`   ❌ No tiene temporada 2026 cargada aún.`);
      }
    }

  } catch (error) {
    console.error("❌ Error durante la consulta:", error);
  }
}

checkCoverage();
