"use server";

import { createClient } from "@/utils/supabase/server";
import worldCupData from "@/data/world-cup-2026.json";
import { TeamStanding } from "@/types/tournament";

/**
 * Calcula las posiciones de todos los grupos basándose en los resultados reales de la BD.
 */
export async function calculateGroupStandings(): Promise<Record<string, TeamStanding[]>> {
  const supabase = await createClient();
  
  const { data: results } = await supabase
    .from('match_results')
    .select('*');

  const standings: Record<string, TeamStanding[]> = {};

  worldCupData.equipos.forEach(team => {
    if (!standings[team.grupo]) standings[team.grupo] = [];
    standings[team.grupo].push({
      teamId: team.id,
      nombre: team.nombre,
      pj: 0, pg: 0, pe: 0, pp: 0,
      gf: 0, gc: 0, dg: 0, pts: 0,
      grupo: team.grupo
    });
  });

  results?.forEach(res => {
    const match = worldCupData.partidos.find(m => m.id === res.id);
    if (!match || !match.grupo) return;

    const groupTeams = standings[match.grupo];
    const home = groupTeams.find(t => t.teamId === res.home_team_id);
    const away = groupTeams.find(t => t.teamId === res.away_team_id);

    if (home && away) {
      home.pj++;
      away.pj++;
      home.gf += res.home_score || 0;
      home.gc += res.away_score || 0;
      away.gf += res.away_score || 0;
      away.gc += res.home_score || 0;

      if ((res.home_score || 0) > (res.away_score || 0)) {
        home.pg++; home.pts += 3;
        away.pp++;
      } else if ((res.home_score || 0) < (res.away_score || 0)) {
        away.pg++; away.pts += 3;
        home.pp++;
      } else {
        home.pe++; home.pts += 1;
        away.pe++; away.pts += 1;
      }
      home.dg = home.gf - home.gc;
      away.dg = away.gf - away.gc;
    }
  });

  Object.keys(standings).forEach(group => {
    standings[group].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    });
  });

  return standings;
}

/**
 * Obtiene los 8 mejores terceros lugares de entre los 12 grupos.
 */
export async function getBestThirdPlaces(allStandings: Record<string, TeamStanding[]>): Promise<TeamStanding[]> {
  const thirds: TeamStanding[] = [];

  Object.values(allStandings).forEach(group => {
    if (group && group.length >= 3) {
      thirds.push(group[2]);
    }
  });

  return thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    return b.gf - a.gf;
  }).slice(0, 8);
}

/**
 * Ejecuta la promoción masiva de equipos de Grupos a 16avos.
 */
export async function promoteTeamsToRoundOf32() {
  const supabase = await createClient();
  const standings = await calculateGroupStandings();
  const bestThirds = await getBestThirdPlaces(standings);

  const roundOf32Matches = [
    { match_id: 73, home: standings['A'][1], away: standings['C'][1] }, 
    { match_id: 74, home: standings['A'][0], away: bestThirds[7] },     
    { match_id: 75, home: standings['B'][0], away: bestThirds[6] },     
    { match_id: 76, home: standings['B'][1], away: standings['F'][1] }, 
    { match_id: 77, home: standings['C'][0], away: standings['D'][1] }, 
    { match_id: 78, home: standings['D'][0], away: bestThirds[5] },     
    { match_id: 79, home: standings['E'][0], away: bestThirds[4] },     
    { match_id: 80, home: standings['E'][1], away: standings['I'][1] }, 
    { match_id: 81, home: standings['F'][0], away: standings['G'][1] }, 
    { match_id: 82, home: standings['G'][0], away: bestThirds[3] },     
    { match_id: 83, home: standings['H'][0], away: standings['J'][1] }, 
    { match_id: 84, home: standings['H'][1], away: standings['L'][1] }, 
    { match_id: 85, home: standings['I'][0], away: bestThirds[2] },     
    { match_id: 86, home: standings['J'][0], away: standings['H'][1] }, 
    { match_id: 87, home: standings['K'][0], away: bestThirds[1] },     
    { match_id: 88, home: standings['L'][0], away: bestThirds[0] }      
  ];

  const upserts = roundOf32Matches.map(m => ({
    id: m.match_id,
    home_team_id: m.home?.teamId || 'TBD',
    away_team_id: m.away?.teamId || 'TBD',
    status: 'pendiente'
  }));

  const { error } = await supabase
    .from('match_results')
    .upsert(upserts, { onConflict: 'id' });

  return { success: !error, error };
}
