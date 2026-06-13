import { APIFootballFixtureResponse, MatchStatus } from "@/types/tournament";
import { createAdminClient } from "@/utils/supabase/admin";
import worldCupData from "@/data/world-cup-2026.json";

// Diccionario de traducción de nombres de equipos en inglés/español de la API a códigos FIFA
const TEAM_MAP: Record<string, string> = {
  "mexico": "MEX",
  "south africa": "RSA",
  "sudafrica": "RSA",
  "korea": "KOR",
  "czech": "CZE",
  "canada": "CAN",
  "switzerland": "SUI",
  "suiza": "SUI",
  "qatar": "QAT",
  "bosnia": "BIH",
  "brazil": "BRA",
  "brasil": "BRA",
  "morocco": "MAR",
  "marruecos": "MAR",
  "usa": "USA",
  "united states": "USA",
  "estados unidos": "USA",
  "paraguay": "PAR",
  "australia": "AUS",
  "turkey": "TUR",
  "turquia": "TUR",
  "turkiye": "TUR",
  "türkiye": "TUR",
  "argentina": "ARG",
  "sweden": "SWE",
  "suecia": "SWE",
  "cameroon": "CMR",
  "camerun": "CMR",
  "honduras": "HON",
  "france": "FRA",
  "francia": "FRA",
  "ukraine": "UKR",
  "ucrania": "UKR",
  "iraq": "IRQ",
  "irak": "IRQ",
  "new zealand": "NZL",
  "nueva zelanda": "NZL",
  "spain": "ESP",
  "espana": "ESP",
  "denmark": "DEN",
  "dinamarca": "DEN",
  "nigeria": "NGA",
  "jamaica": "JAM",
  "england": "ENG",
  "inglaterra": "ENG",
  "poland": "POL",
  "polonia": "POL",
  "egypt": "EGY",
  "egipto": "EGY",
  "panama": "PAN",
  "italy": "ITA",
  "italia": "ITA",
  "serbia": "SRB",
  "algeria": "ALG",
  "argelia": "ALG",
  "costa rica": "CRC",
  "portugal": "POR",
  "netherlands": "NED",
  "paises bajos": "NED",
  "holand": "NED",
  "japan": "JPN",
  "japon": "JPN",
  "ecuador": "ECU",
  "uruguay": "URU",
  "germany": "GER",
  "alemania": "GER",
  "iran": "IRN",
  "ghana": "GHA",
  "belgium": "BEL",
  "belgica": "BEL",
  "colombia": "COL",
  "saudi arabia": "KSA",
  "arabia saudita": "KSA",
  "peru": "PER",
  "venezuela": "VEN",
  "chile": "CHI",
  "senegal": "SEN",
  "tunisia": "TUN",
  "tunez": "TUN",
  "croatia": "CRO",
  "croacia": "CRO",
  "haiti": "HAI",
  "haití": "HAI",
  "scotland": "SCO",
  "escocia": "SCO",
  "curacao": "CUW",
  "curazao": "CUW",
  "curaçao": "CUW",
  "ivory coast": "CIV",
  "costa de marfil": "CIV",
  "cape verde": "CPV",
  "cabo verde": "CPV",
  "norway": "NOR",
  "noruega": "NOR",
  "austria": "AUT",
  "jordan": "JOR",
  "jordania": "JOR",
  "congo dr": "COD",
  "congo rd": "COD",
  "rd congo": "COD",
  "uzbekistan": "UZB",
  "uzbekistán": "UZB"
};

function mapApiTeamToLocalCode(apiTeamName: string): string | null {
  const name = apiTeamName.toLowerCase().trim();
  
  // 1. Coincidencia exacta o parcial por palabras clave del mapa
  for (const [key, code] of Object.entries(TEAM_MAP)) {
    if (name.includes(key)) return code;
  }
  
  // 2. Coincidencia aproximada tolerante a acentos
  const normalizedApiName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const localTeam = worldCupData.equipos.find(t => {
    const normalizedLocalName = t.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedLocalName.includes(normalizedApiName) || normalizedApiName.includes(normalizedLocalName);
  });
  
  if (localTeam) return localTeam.id;

  return null;
}


/**
 * SportsSyncAgent
 * Agente encargado de comunicarse con API-Football v3.
 * Si no se provee un API Key en las variables de entorno, el agente entra
 * en "Mock Mode" (Modo Simulador) devolviendo datos ficticios para poder
 * continuar con el desarrollo del Oráculo y el Gamification Engine.
 */
export class SportsSyncAgent {
  private readonly baseUrl = "https://v3.football.api-sports.io";
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY;
    
    const inactiveKey = "2672e54b9659d01a9d41a50005dc6849";
    const isInactive = this.apiKey === inactiveKey;
    
    if (!this.apiKey || isInactive) {
      console.error("❌ SportsSyncAgent: API_FOOTBALL_KEY no está configurada o es inválida/inactiva. Sincronización en modo pasivo.");
      this.apiKey = undefined;
    }
  }

  /**
   * Obtiene los resultados en vivo de una lista de IDs de partidos (Fixture IDs de la API).
   */
  async getLiveScores(fixtureIds: number[]): Promise<APIFootballFixtureResponse[]> {
    if (!this.apiKey) {
      console.error("❌ getLiveScores: API Key no configurada.");
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/fixtures?ids=${fixtureIds.join("-")}`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": this.apiKey,
        },
        next: { revalidate: 60 } 
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.response as APIFootballFixtureResponse[];
    } catch (error) {
      console.error("❌ Error en SportsSyncAgent getLiveScores:", error);
      return [];
    }
  }

  /**
   * Obtiene un único partido REAL que se esté jugando en este mismo instante en el mundo.
   * Utilizado para tests visuales en producción.
   */
  async getAnyRealLiveMatch(): Promise<APIFootballFixtureResponse | null> {
    if (!this.apiKey) {
      console.error("❌ getAnyRealLiveMatch: API Key no configurada.");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/fixtures?live=all`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": this.apiKey,
        },
        cache: "no-store"
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      
      if (data.response && data.response.length > 0) {
        return data.response[0] as APIFootballFixtureResponse;
      }
      
      return null;
    } catch (error) {
      console.error("❌ Error en SportsSyncAgent getAnyRealLiveMatch:", error);
      return null;
    }
  }

  /**
   * Transforma el status corto de la API a nuestro modelo interno.
   */
  mapStatusToInternal(apiShortStatus: string): MatchStatus {
    const playingStatuses = ["1H", "HT", "2H", "ET", "P", "PEN", "BT", "LIVE"];
    const finishedStatuses = ["FT", "AET", "PEN"];

    if (apiShortStatus === "NS") return "pending";
    if (finishedStatuses.includes(apiShortStatus)) return "finished";
    if (playingStatuses.includes(apiShortStatus)) {
      return (apiShortStatus === "LIVE" ? "playing" : apiShortStatus) as MatchStatus;
    }
    
    return "pending";
  }

  /**
   * Eje de Sincronización: Obtiene los resultados reales de la API y los empuja
   * directamente a la base de datos oficial del torneo.
   */
  async syncMatchesToDatabase(fixtureIds: number[]): Promise<{ success: boolean; updatedCount: number }> {
    console.log(`🔄 Sincronizando partidos con Supabase...`);
    if (!this.apiKey) {
      console.error("❌ Abortando sincronización: API_FOOTBALL_KEY no está configurada en este entorno.");
      return { success: false, updatedCount: 0 };
    }

    let liveData: APIFootballFixtureResponse[] = [];
    
    try {
      const response = await fetch(`${this.baseUrl}/fixtures?league=1&season=2026`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": this.apiKey,
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      liveData = data.response || [];
      console.log(`ℹ️ [SportsSyncAgent] Se recibieron ${liveData.length} partidos reales desde la API.`);
    } catch (error) {
      console.error("❌ Error en SportsSyncAgent syncMatchesToDatabase en vivo:", error);
      return { success: false, updatedCount: 0 };
    }
    
    if (!liveData || liveData.length === 0) {
      return { success: false, updatedCount: 0 };
    }

    const supabase = createAdminClient();
    
    const { data: dbMatches } = await supabase
      .from('match_results')
      .select('id, home_team_id, away_team_id, status');
    
    const dbMatchesMap = new Map(dbMatches?.map((m: any) => [`${m.home_team_id}-${m.away_team_id}`, m.id]) || []);
    
    const upserts: any[] = [];

    for (const apiMatch of liveData) {
      const homeName = (apiMatch as any).teams?.home?.name;
      const awayName = (apiMatch as any).teams?.away?.name;

      if (!homeName || !awayName) continue;

      const homeCode = mapApiTeamToLocalCode(homeName);
      const awayCode = mapApiTeamToLocalCode(awayName);

      if (!homeCode || !awayCode) {
        if (homeName.includes("Mexico") || awayName.includes("Mexico")) {
          console.warn(`⚠️ No se pudo mapear equipos de la API: ${homeName} vs ${awayName}`);
        }
        continue;
      }

      let localMatchId: number | null = null;
      
      const staticMatch = worldCupData.partidos.find(m => 
        (m.local === homeCode && m.visitante === awayCode) ||
        (m.local === awayCode && m.visitante === homeCode)
      );

      if (staticMatch) {
        localMatchId = staticMatch.id;
      } else {
        const dbId = dbMatchesMap.get(`${homeCode}-${awayCode}`) || dbMatchesMap.get(`${awayCode}-${homeCode}`);
        if (dbId) {
          localMatchId = dbId as number;
        }
      }

      if (!localMatchId) {
        continue;
      }

      const isHomeSame = staticMatch 
        ? staticMatch.local === homeCode 
        : dbMatches?.find((m: any) => m.id === localMatchId)?.home_team_id === homeCode;

      const rawHomeScore = isHomeSame ? apiMatch.goals.home : apiMatch.goals.away;
      const rawAwayScore = isHomeSame ? apiMatch.goals.away : apiMatch.goals.home;
      const apiStatus = this.mapStatusToInternal(apiMatch.fixture.status.short);

      const homeScore = apiStatus === 'pending' ? null : rawHomeScore;
      const awayScore = apiStatus === 'pending' ? null : rawAwayScore;

      if (apiStatus === 'pending' && (rawHomeScore !== null || rawAwayScore !== null)) {
        console.warn(`🚨 [SportsSyncAgent] CONTAMINACIÓN DETECTADA: La API marcó ${homeName} vs ${awayName} como NS pero tenía goles (${rawHomeScore}-${rawAwayScore}). Se resetean a null.`);
      }

      upserts.push({
        id: localMatchId,
        api_fixture_id: apiMatch.fixture.id,
        home_team_id: homeCode,
        away_team_id: awayCode,
        home_score: homeScore,
        away_score: awayScore,
        status: apiStatus,
        elapsed: apiMatch.fixture.status.elapsed ?? 0,
        last_sync: new Date().toISOString()
      });
    }

    if (upserts.length === 0) {
      console.warn("⚠️ Ningún partido de la API coincidió con el fixture local de MundiApp26.");
      return { success: true, updatedCount: 0 };
    }

    const { error } = await supabase
      .from('match_results')
      .upsert(upserts, { onConflict: 'id' });

    if (error) {
      console.error("❌ Error crítico empujando datos a Supabase:", error);
      return { success: false, updatedCount: 0 };
    }

    console.log(`✅ Sincronización exitosa: ${upserts.length} partidos procesados y actualizados en BD.`);

    // --- PROCESAMIENTO DE GOLES EN VIVO Y EVENTOS ---
    try {
      const dbMatchesStatusMap = new Map(dbMatches?.map((m: any) => [m.id, m.status]) || []);

      const matchesToProcessGoals = upserts.filter(m => {
        const previousStatus = dbMatchesStatusMap.get(m.id);
        const isActive = m.status !== 'finished' && m.status !== 'pending' && m.status !== 'bloqueado';
        const isNewlyFinished = m.status === 'finished' && previousStatus !== 'finished';
        return isActive || isNewlyFinished;
      });

      for (const match of matchesToProcessGoals) {
        if (match.api_fixture_id) {
          const response = await fetch(`${this.baseUrl}/fixtures?id=${match.api_fixture_id}`, {
            method: "GET",
            headers: {
              "x-rapidapi-host": "v3.football.api-sports.io",
              "x-rapidapi-key": this.apiKey as string,
            },
            next: { revalidate: 0 } 
          });

          if (response.ok) {
            const data = await response.json();
            const apiMatchDetail = data.response?.[0];
            if (apiMatchDetail && apiMatchDetail.events) {
              const goals = apiMatchDetail.events.filter((ev: any) => ev.type === 'Goal');
              
              const goalsList = goals.map((ev: any) => {
                const teamCode = mapApiTeamToLocalCode(ev.team.name) || ev.team.name;
                return {
                  team: teamCode,
                  player: ev.player.name || 'Desconocido',
                  minute: ev.time.elapsed + (ev.time.extra ? `+${ev.time.extra}` : '')
                };
              }).sort((a: any, b: any) => {
                const minA = parseInt(a.minute) || 0;
                const minB = parseInt(b.minute) || 0;
                return minA - minB;
              });

              if (goalsList.length > 0) {
                // 1. Guardar la lista completa de goles
                await supabase
                  .from('app_settings')
                  .upsert({
                    key: `goals_${match.id}`,
                    value: JSON.stringify(goalsList)
                  }, { onConflict: 'key' });

                // 2. Guardar el último gol para la animación de gol reciente
                const sortedDesc = [...goalsList].sort((a: any, b: any) => {
                  const minA = parseInt(a.minute) || 0;
                  const minB = parseInt(b.minute) || 0;
                  return minB - minA;
                });
                const lastGoal = sortedDesc[0];
                const goalInfo = {
                  ...lastGoal,
                  timestamp: new Date().toISOString()
                };

                await supabase
                  .from('app_settings')
                  .upsert({
                    key: `goal_${match.id}`,
                    value: JSON.stringify(goalInfo)
                  }, { onConflict: 'key' });

                console.log(`⚽ [SportsSyncAgent] Goles grabados para partido ${match.id}:`, goalsList);
              }
            }
          }
        }
      }
    } catch (eventsError) {
      console.error("⚠️ Error procesando goles en vivo en SportsSyncAgent:", eventsError);
    }

    return { success: true, updatedCount: upserts.length };
  }

  /**
   * Obtiene la tabla de posiciones desde API-Football (Endpoint /standings).
   */
  async getStandings(leagueId: number, season: number): Promise<any[]> {
    if (!this.apiKey) {
      console.error("❌ getStandings: API Key no configurada.");
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/standings?league=${leagueId}&season=${season}`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": this.apiKey,
        },
        next: { revalidate: 300 } 
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.response[0]?.league?.standings || [];
    } catch (error) {
      console.error("❌ Error fetching standings:", error);
      return [];
    }
  }
}

export const sportsSyncAgent = new SportsSyncAgent();
