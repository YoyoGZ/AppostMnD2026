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
  "croacia": "CRO"
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
  private readonly isMockMode: boolean;

  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY;
    
    // Si la clave es la antigua inactiva, o no existe, forzamos Mock Mode
    const inactiveKey = "2672e54b9659d01a9d41a50005dc6849";
    const isInactive = this.apiKey === inactiveKey;
    
    this.isMockMode = !this.apiKey || isInactive;
    
    if (this.isMockMode) {
      if (isInactive) {
        console.warn("⚠️ SportsSyncAgent: La clave API_FOOTBALL_KEY actual es la clave inactiva/reseteada. Se fuerza MOCK MODE.");
      } else {
        console.warn("⚠️ SportsSyncAgent iniciado en MOCK MODE. No se usarán llamadas reales a la API.");
      }
    }
  }

  /**
   * Obtiene los resultados en vivo de una lista de IDs de partidos (Fixture IDs de la API).
   */
  async getLiveScores(fixtureIds: number[]): Promise<APIFootballFixtureResponse[]> {
    if (this.isMockMode) {
      return this.generateMockLiveScores(fixtureIds);
    }

    try {
      const response = await fetch(`${this.baseUrl}/fixtures?ids=${fixtureIds.join("-")}`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": this.apiKey as string,
        },
        // Mantenemos la caché por 60 segundos para evitar agotar el plan accidentalmente
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
      console.warn("No hay API_FOOTBALL_KEY. Entrando en mock mode forzado para live test.");
      return this.generateMockLiveScores([2])[0];
    }

    try {
      const response = await fetch(`${this.baseUrl}/fixtures?live=all`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": this.apiKey,
        },
        // No cacheamos o le damos muy poco tiempo porque es una prueba EN VIVO estricta
        cache: "no-store"
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      
      // Devolvemos el primer partido que encuentre (o null si literalmente no hay futbol en el mundo ahora)
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
    const finishedStatuses = ["FT", "AET", "PEN"]; // Finalizado regular, alargue, o penales

    if (apiShortStatus === "NS") return "pending";
    if (finishedStatuses.includes(apiShortStatus)) return "finished";
    if (playingStatuses.includes(apiShortStatus)) {
      return (apiShortStatus === "LIVE" ? "playing" : apiShortStatus) as MatchStatus;
    }
    
    return "pending"; // Default fallback
  }

  /**
   * Eje de Sincronización: Obtiene los resultados (API o Mock) y los empuja
   * directamente a la base de datos oficial del torneo.
   * Utiliza el Admin Client para evitar bloqueos de RLS.
   */
  async syncMatchesToDatabase(fixtureIds: number[]): Promise<{ success: boolean; updatedCount: number }> {
    console.log(`🔄 Sincronizando partidos con Supabase...`);
    
    let liveData: APIFootballFixtureResponse[] = [];
    
    if (this.isMockMode) {
      liveData = await this.getLiveScores(fixtureIds);
    } else {
      // MODO REAL: Consultamos todo el fixture de la Copa del Mundo 2026 en API-Football (League ID: 1)
      try {
        const response = await fetch(`${this.baseUrl}/fixtures?league=1&season=2026`, {
          method: "GET",
          headers: {
            "x-rapidapi-host": "v3.football.api-sports.io",
            "x-rapidapi-key": this.apiKey as string,
          },
          next: { revalidate: 60 } 
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        liveData = data.response || [];
        console.log(`ℹ️ [SportsSyncAgent] Se recibieron ${liveData.length} partidos reales desde la API.`);
      } catch (error) {
        console.error("❌ Error en SportsSyncAgent getLiveScores en vivo:", error);
        return { success: false, updatedCount: 0 };
      }
    }
    
    if (!liveData || liveData.length === 0) {
      return { success: false, updatedCount: 0 };
    }

    const supabase = createAdminClient();
    
    // Obtener los partidos que ya existan en match_results (útil para mapear eliminatorias dinámicas)
    const { data: dbMatches } = await supabase
      .from('match_results')
      .select('id, home_team_id, away_team_id');
    
    const dbMatchesMap = new Map(dbMatches?.map((m: any) => [`${m.home_team_id}-${m.away_team_id}`, m.id]) || []);
    
    const upserts: any[] = [];

    for (const apiMatch of liveData) {
      if (this.isMockMode) {
        // En MOCK MODE, el ID de la API coincide con el ID de nuestro fixture
        const localMatch = worldCupData.partidos.find(m => m.id === apiMatch.fixture.id);
        const item: any = {
          id: apiMatch.fixture.id,
          api_fixture_id: apiMatch.fixture.id,
          home_score: apiMatch.goals.home,
          away_score: apiMatch.goals.away,
          status: this.mapStatusToInternal(apiMatch.fixture.status.short),
          elapsed: apiMatch.fixture.status.elapsed ?? 0,
          last_sync: new Date().toISOString()
        };

        if (localMatch) {
          item.home_team_id = localMatch.local;
          item.away_team_id = localMatch.visitante;
        }
        upserts.push(item);
      } else {
        // EN MODO REAL: Mapeamos los partidos cruzando los códigos de equipos locales y visitantes
        const homeName = (apiMatch as any).teams?.home?.name;
        const awayName = (apiMatch as any).teams?.away?.name;

        if (!homeName || !awayName) continue;

        const homeCode = mapApiTeamToLocalCode(homeName);
        const awayCode = mapApiTeamToLocalCode(awayName);

        if (!homeCode || !awayCode) {
          // No logueamos todo para evitar spam, pero advertimos si es México o Sudáfrica
          if (homeName.includes("Mexico") || awayName.includes("Mexico")) {
            console.warn(`⚠️ No se pudo mapear equipos de la API: ${homeName} vs ${awayName}`);
          }
          continue;
        }

        // Buscamos el ID de partido local correspondiente en el fixture de grupos
        let localMatchId: number | null = null;
        
        const staticMatch = worldCupData.partidos.find(m => 
          (m.local === homeCode && m.visitante === awayCode) ||
          (m.local === awayCode && m.visitante === homeCode)
        );

        if (staticMatch) {
          localMatchId = staticMatch.id;
        } else {
          // Si no es fase de grupos, buscamos si hay una eliminatoria ya desplegada con estos equipos
          const dbId = dbMatchesMap.get(`${homeCode}-${awayCode}`) || dbMatchesMap.get(`${awayCode}-${homeCode}`);
          if (dbId) {
            localMatchId = dbId as number;
          }
        }

        if (!localMatchId) {
          continue;
        }

        // Verificamos si en la API el equipo local/visitante está en el mismo orden que nuestro fixture
        const isHomeSame = staticMatch 
          ? staticMatch.local === homeCode 
          : dbMatches?.find((m: any) => m.id === localMatchId)?.home_team_id === homeCode;

        const homeScore = isHomeSame ? apiMatch.goals.home : apiMatch.goals.away;
        const awayScore = isHomeSame ? apiMatch.goals.away : apiMatch.goals.home;

        upserts.push({
          id: localMatchId,
          api_fixture_id: apiMatch.fixture.id,
          home_team_id: homeCode,
          away_team_id: awayCode,
          home_score: homeScore,
          away_score: awayScore,
          status: this.mapStatusToInternal(apiMatch.fixture.status.short),
          elapsed: apiMatch.fixture.status.elapsed ?? 0,
          last_sync: new Date().toISOString()
        });
      }
    }

    if (upserts.length === 0) {
      console.warn("⚠️ Ningún partido de la API coincidió con el fixture local de MundiApp26.");
      return { success: true, updatedCount: 0 };
    }

    // Realizamos un 'upsert' masivo. Si el ID ya existe, actualiza los goles y el estado.
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
      const activeMatches = upserts.filter(m => 
        m.status !== 'finished' && m.status !== 'pending' && m.status !== 'bloqueado'
      );

      for (const match of activeMatches) {
        if (this.isMockMode) {
          // En modo Mock, si el partido 2 (CAN vs SUI) está activo, simulamos un gol
          if (match.id === 2 && match.home_score > 0) {
            const mockGoal = {
              team: 'CAN',
              player: 'Alphonso Davies',
              minute: 72,
              timestamp: new Date().toISOString()
            };
            await supabase
              .from('app_settings')
              .upsert({
                key: `goal_${match.id}`,
                value: JSON.stringify(mockGoal)
              }, { onConflict: 'key' });
            console.log(`ℹ️ [SportsSyncAgent] Mock goal simulated for match ${match.id}`);
          }
        } else if (match.api_fixture_id) {
          // En modo real, consultamos los detalles específicos de este partido por su ID
          const response = await fetch(`${this.baseUrl}/fixtures?id=${match.api_fixture_id}`, {
            method: "GET",
            headers: {
              "x-rapidapi-host": "v3.football.api-sports.io",
              "x-rapidapi-key": this.apiKey as string,
            },
            next: { revalidate: 0 } // Datos totalmente en vivo, sin cache
          });

          if (response.ok) {
            const data = await response.json();
            const apiMatchDetail = data.response?.[0];
            if (apiMatchDetail && apiMatchDetail.events) {
              const goals = apiMatchDetail.events.filter((ev: any) => ev.type === 'Goal');
              if (goals.length > 0) {
                // Ordenar por el minuto más reciente
                goals.sort((a: any, b: any) => (b.time.elapsed + (b.time.extra || 0)) - (a.time.elapsed + (a.time.extra || 0)));
                const lastGoal = goals[0];
                const teamCode = mapApiTeamToLocalCode(lastGoal.team.name) || lastGoal.team.name;
                
                const goalInfo = {
                  team: teamCode,
                  player: lastGoal.player.name || 'Desconocido',
                  minute: lastGoal.time.elapsed + (lastGoal.time.extra ? `+${lastGoal.time.extra}` : ''),
                  timestamp: new Date().toISOString()
                };

                await supabase
                  .from('app_settings')
                  .upsert({
                    key: `goal_${match.id}`,
                    value: JSON.stringify(goalInfo)
                  }, { onConflict: 'key' });
                console.log(`⚽ [SportsSyncAgent] Gol en vivo registrado para partido ${match.id}:`, goalInfo);
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

  // --- MOCK GENERATOR PARA DESARROLLO ---

  private generateMockLiveScores(fixtureIds: number[]): APIFootballFixtureResponse[] {
    const isBulkSimulation = fixtureIds.length > 10;

    return fixtureIds.map(id => {
      // Si es simulación masiva (Fase de Grupos completa), finalizamos todos los partidos
      if (isBulkSimulation) {
        // Marcadores estables basados en el ID para evitar empates masivos y tener variedad
        const homeScore = (id % 3);
        const awayScore = ((id + 2) % 3);
        return {
          fixture: { id, status: { short: "FT", elapsed: 90 } },
          goals: { home: homeScore, away: awayScore },
          score: { penalty: { home: null, away: null } }
        };
      }

      // Simulamos que el partido 2 (CAN vs SUI) está en vivo (Segundo Tiempo)
      if (id === 2) {
        return {
          fixture: { id, status: { short: "2H", elapsed: 75 } },
          goals: { home: 1, away: 0 },
          score: { penalty: { home: null, away: null } }
        };
      }
      
      // Simulamos que el partido 3 (USA vs PAR) terminó (FT)
      if (id === 3) {
        return {
          fixture: { id, status: { short: "FT", elapsed: 90 } },
          goals: { home: 2, away: 0 },
          score: { penalty: { home: null, away: null } }
        };
      }

      // Simulamos que el partido 4 (BRA vs MAR) está en el Medio Tiempo (HT)
      if (id === 4) {
        return {
          fixture: { id, status: { short: "HT", elapsed: 45 } },
          goals: { home: 1, away: 1 },
          score: { penalty: { home: null, away: null } }
        };
      }

      // El resto como No Iniciados (NS)
      return {
        fixture: { id, status: { short: "NS", elapsed: null } },
        goals: { home: null, away: null },
        score: { penalty: { home: null, away: null } }
      };
    });
  }

  /**
   * Obtiene la tabla de posiciones desde API-Football (Endpoint /standings).
   * En modo MOCK, devuelve datos simulados que reflejan los partidos inyectados.
   */
  async getStandings(leagueId: number, season: number): Promise<any[]> {
    if (this.isMockMode) {
      return this.generateMockStandings();
    }

    try {
      const response = await fetch(`${this.baseUrl}/standings?league=${leagueId}&season=${season}`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": this.apiKey as string,
        },
        next: { revalidate: 300 } // Caché 5 min para tabla de posiciones
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.response[0]?.league?.standings || [];
    } catch (error) {
      console.error("❌ Error fetching standings:", error);
      return [];
    }
  }

  private generateMockStandings(): any[] {
    // Simulamos la respuesta de API-Football para los grupos B, C y D
    // Reflejando los resultados de los partidos 2 (CAN 1-0 SUI), 3 (USA 2-0 PAR), 4 (BRA 1-1 MAR)
    return [
      [
        { team: { name: "Canadá", id: "CAN" }, points: 3, all: { played: 1, win: 1, draw: 0, lose: 0, goals: { for: 1, against: 0 } }, group: "Grupo B" },
        { team: { name: "Suiza", id: "SUI" }, points: 0, all: { played: 1, win: 0, draw: 0, lose: 1, goals: { for: 0, against: 1 } }, group: "Grupo B" },
        { team: { name: "Qatar", id: "QAT" }, points: 0, all: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } }, group: "Grupo B" },
        { team: { name: "Bosnia y Herz.", id: "BIH" }, points: 0, all: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } }, group: "Grupo B" }
      ],
      [
        { team: { name: "Brasil", id: "BRA" }, points: 1, all: { played: 1, win: 0, draw: 1, lose: 0, goals: { for: 1, against: 1 } }, group: "Grupo C" },
        { team: { name: "Marruecos", id: "MAR" }, points: 1, all: { played: 1, win: 0, draw: 1, lose: 0, goals: { for: 1, against: 1 } }, group: "Grupo C" },
        { team: { name: "Escocia", id: "SCO" }, points: 0, all: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } }, group: "Grupo C" },
        { team: { name: "Haití", id: "HAI" }, points: 0, all: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } }, group: "Grupo C" }
      ],
      [
        { team: { name: "Estados Unidos", id: "USA" }, points: 3, all: { played: 1, win: 1, draw: 0, lose: 0, goals: { for: 2, against: 0 } }, group: "Grupo D" },
        { team: { name: "Paraguay", id: "PAR" }, points: 0, all: { played: 1, win: 0, draw: 0, lose: 1, goals: { for: 0, against: 2 } }, group: "Grupo D" },
        { team: { name: "Australia", id: "AUS" }, points: 0, all: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } }, group: "Grupo D" },
        { team: { name: "Türkiye", id: "TUR" }, points: 0, all: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } }, group: "Grupo D" }
      ]
    ];
  }
}

// Exportamos una instancia única (Singleton) para usarla en toda la app
export const sportsSyncAgent = new SportsSyncAgent();
