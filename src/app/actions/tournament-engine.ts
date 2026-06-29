"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import worldCupData from "@/data/world-cup-2026.json";
import { TeamStanding } from "@/types/tournament";
import { mapApiTeamToLocalCode } from "@/services/SportsSyncAgent";
import knockoutData from "@/data/knockouts-simulation.json";


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

  worldCupData.partidos.forEach(match => {
    if (!match.grupo) return;

    // Buscar si hay un registro del partido en la base de datos de Supabase
    const dbRes = results?.find(r => r.id === match.id);

    // Determinar si el partido está finalizado y extraer los marcadores correspondientes
    let isFinished = false;
    let homeScore = 0;
    let awayScore = 0;
    let homeTeamId = match.local;
    let awayTeamId = match.visitante;

    if (dbRes && dbRes.status === 'finished') {
      isFinished = true;
      homeScore = dbRes.home_score ?? 0;
      awayScore = dbRes.away_score ?? 0;
      homeTeamId = dbRes.home_team_id || homeTeamId;
      awayTeamId = dbRes.away_team_id || awayTeamId;
    } else if (match.estado === 'finalizado') {
      isFinished = true;
      homeScore = match.goles_local ?? 0;
      awayScore = match.goles_visitante ?? 0;
    }

    if (isFinished) {
      const groupTeams = standings[match.grupo];
      const home = groupTeams.find(t => t.teamId === homeTeamId);
      const away = groupTeams.find(t => t.teamId === awayTeamId);

      if (home && away) {
        home.pj++;
        away.pj++;
        home.gf += homeScore;
        home.gc += awayScore;
        away.gf += awayScore;
        away.gc += homeScore;

        if (homeScore > awayScore) {
          home.pg++; home.pts += 3;
          away.pp++;
        } else if (homeScore < awayScore) {
          away.pg++; away.pts += 3;
          home.pp++;
        } else {
          home.pe++; home.pts += 1;
          away.pe++; away.pts += 1;
        }
        home.dg = home.gf - home.gc;
        away.dg = away.gf - away.gc;
      }
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
  const supabase = createAdminClient();
  
  // Obtener los partidos de 16avos del JSON local fijado
  const r32Partidos = knockoutData.rondas.find(r => r.id === 'r32')?.partidos || [];

  const upserts = r32Partidos.map(m => ({
    id: m.id,
    home_team_id: (m as any).home_team_id || 'TBD',
    away_team_id: (m as any).away_team_id || 'TBD',
    status: 'pending'
  }));

  console.log(`[TournamentEngine] Desplegando ${upserts.length} partidos consolidables del JSON a Supabase...`);
  const { error } = await supabase
    .from('match_results')
    .upsert(upserts, { onConflict: 'id' });

  return { success: !error, error: error?.message };
}

/**
 * Avanza y publica los clasificados de la ronda de eliminatorias actual a la siguiente fase.
 */
export async function advanceActiveRoundWinnersAction(
  roundSlug: string,
  manualWinners?: Record<number, string>
): Promise<{ success: boolean; error?: string; advancedCount: number }> {
  try {
    const supabase = createAdminClient();

    // 1. Obtener la ronda del JSON
    const round = knockoutData.rondas.find(r => r.id === roundSlug || r.slug === roundSlug);
    if (!round) {
      return { success: false, error: "Ronda de eliminatorias no válida.", advancedCount: 0 };
    }

    const matchIds = round.partidos.map(p => p.id);
    if (matchIds.length === 0) {
      return { success: true, advancedCount: 0 };
    }

    // 2. Obtener resultados reales de Supabase para esta ronda
    const { data: results, error: resultsError } = await supabase
      .from('match_results')
      .select('*')
      .in('id', matchIds);

    if (resultsError) throw resultsError;

    // 3. Mapa de progresión lógica de llaves
    const KNOCKOUT_PATH_MAP: Record<number, { next_match: number; next_pos: 'home' | 'away' }> = {
      // 16avos (73-88) -> Octavos (89-96)
      73: { next_match: 90, next_pos: 'home' },
      74: { next_match: 89, next_pos: 'home' },
      75: { next_match: 90, next_pos: 'away' },
      76: { next_match: 93, next_pos: 'home' },
      77: { next_match: 89, next_pos: 'away' },
      78: { next_match: 93, next_pos: 'away' },
      79: { next_match: 94, next_pos: 'home' },
      80: { next_match: 94, next_pos: 'away' },
      81: { next_match: 92, next_pos: 'home' },
      82: { next_match: 92, next_pos: 'away' },
      83: { next_match: 91, next_pos: 'home' },
      84: { next_match: 91, next_pos: 'away' },
      85: { next_match: 96, next_pos: 'home' },
      86: { next_match: 95, next_pos: 'home' },
      87: { next_match: 96, next_pos: 'away' },
      88: { next_match: 95, next_pos: 'away' },

      // Octavos (89-96) -> Cuartos (97-100)
      89: { next_match: 97, next_pos: 'home' },
      90: { next_match: 97, next_pos: 'away' },
      91: { next_match: 99, next_pos: 'home' },
      92: { next_match: 99, next_pos: 'away' },
      93: { next_match: 98, next_pos: 'home' },
      94: { next_match: 98, next_pos: 'away' },
      95: { next_match: 100, next_pos: 'home' },
      96: { next_match: 100, next_pos: 'away' },

      // Cuartos (97-100) -> Semifinales (101-102)
      97: { next_match: 101, next_pos: 'home' },
      98: { next_match: 101, next_pos: 'away' },
      99: { next_match: 102, next_pos: 'home' },
      100: { next_match: 102, next_pos: 'away' }
    };

    const advancementUpdates: any[] = [];

    for (const matchId of matchIds) {
      const dbMatch = results?.find(r => r.id === matchId);
      if (!dbMatch || dbMatch.status !== 'finished') continue;

      const homeTeam = dbMatch.home_team_id;
      const awayTeam = dbMatch.away_team_id;
      if (!homeTeam || !awayTeam || homeTeam === 'TBD' || awayTeam === 'TBD') continue;

      // Determinar el ganador y perdedor
      let winnerId: string | null = null;
      let loserId: string | null = null;

      const manualWinner = manualWinners?.[matchId];

      const homeScore = dbMatch.home_score ?? 0;
      const awayScore = dbMatch.away_score ?? 0;

      if (manualWinner === homeTeam || manualWinner === awayTeam) {
        winnerId = manualWinner || null;
        loserId = winnerId === homeTeam ? awayTeam : homeTeam;
      } else if (homeScore > awayScore) {
        winnerId = homeTeam;
        loserId = awayTeam;
      } else if (awayScore > homeScore) {
        winnerId = awayTeam;
        loserId = homeTeam;
      } else {
        // En caso de empate no definido, el Admin debe proveer el ganador de penales
        return { 
          success: false, 
          error: `El partido #${matchId} terminó en empate. Por favor selecciona el ganador de la definición por penales en la interfaz.`, 
          advancedCount: 0 
        };
      }

      // 1. Progresión estándar basada en el mapa de llaves (hasta Semis)
      const path = KNOCKOUT_PATH_MAP[matchId];
      if (path && winnerId) {
        advancementUpdates.push({
          id: path.next_match,
          home_team_id: path.next_pos === 'home' ? winnerId : undefined,
          away_team_id: path.next_pos === 'away' ? winnerId : undefined
        });
      }

      // 2. Progresión especial de Semifinales (101-102) a Final (104) y Tercer Puesto (103)
      if (matchId === 101) {
        if (winnerId) advancementUpdates.push({ id: 104, home_team_id: winnerId });
        if (loserId) advancementUpdates.push({ id: 103, home_team_id: loserId });
      } else if (matchId === 102) {
        if (winnerId) advancementUpdates.push({ id: 104, away_team_id: winnerId });
        if (loserId) advancementUpdates.push({ id: 103, away_team_id: loserId });
      }
    }

    if (advancementUpdates.length === 0) {
      return { success: true, error: "No se encontraron nuevos partidos finalizados para avanzar.", advancedCount: 0 };
    }

    // 4. Fusión Inteligente de Clasificados para no pisar campos existentes en Supabase
    const targetIds = advancementUpdates.map(u => u.id);
    const { data: currentTargets } = await supabase
      .from('match_results')
      .select('id, home_team_id, away_team_id')
      .in('id', targetIds);

    const mergedUpdates = advancementUpdates.map(update => {
      const current = currentTargets?.find(t => t.id === update.id);
      return {
        id: update.id,
        home_team_id: update.home_team_id !== undefined ? update.home_team_id : (current?.home_team_id || 'TBD'),
        away_team_id: update.away_team_id !== undefined ? update.away_team_id : (current?.away_team_id || 'TBD'),
        status: 'pending',
        last_sync: new Date().toISOString()
      };
    });

    console.log(`[KnockoutEngine] Realizando upsert de ${mergedUpdates.length} actualizaciones en match_results:`, mergedUpdates);
    
    const { error: upsertError } = await supabase
      .from('match_results')
      .upsert(mergedUpdates, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    return { success: true, advancedCount: mergedUpdates.length };
  } catch (error: any) {
    console.error("Error en advanceActiveRoundWinnersAction:", error);
    return { success: false, error: error.message || "Error interno del servidor", advancedCount: 0 };
  }
}
