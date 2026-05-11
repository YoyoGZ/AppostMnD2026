import { APIFootballFixtureResponse, MatchStatus } from "@/types/tournament";
import { createAdminClient } from "@/utils/supabase/admin";

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
    // Si no hay key, activamos automáticamente el modo simulador
    this.isMockMode = !this.apiKey;
    
    if (this.isMockMode) {
      console.warn("⚠️ SportsSyncAgent iniciado en MOCK MODE. No se usarán llamadas reales a la API.");
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
   * Transforma el status corto de la API a nuestro modelo interno.
   */
  mapStatusToInternal(apiShortStatus: string): MatchStatus {
    const playingStatuses = ["1H", "HT", "2H", "ET", "P", "PEN"];
    const finishedStatuses = ["FT", "AET", "PEN"]; // Finalizado regular, alargue, o penales

    if (apiShortStatus === "NS") return "pending";
    if (finishedStatuses.includes(apiShortStatus)) return "finished";
    if (playingStatuses.includes(apiShortStatus)) return "playing";
    
    return "pending"; // Default fallback
  }

  /**
   * Eje de Sincronización: Obtiene los resultados (API o Mock) y los empuja
   * directamente a la base de datos oficial del torneo.
   * Utiliza el Admin Client para evitar bloqueos de RLS.
   */
  async syncMatchesToDatabase(fixtureIds: number[]): Promise<{ success: boolean; updatedCount: number }> {
    console.log(`🔄 Iniciando sincronización de ${fixtureIds.length} partidos...`);
    const liveData = await this.getLiveScores(fixtureIds);
    
    if (!liveData || liveData.length === 0) {
      return { success: false, updatedCount: 0 };
    }

    const supabase = createAdminClient();
    
    // Transformamos el formato de la API al esquema de nuestra base de datos (match_results)
    const upserts = liveData.map(apiMatch => ({
      id: apiMatch.fixture.id,
      home_score: apiMatch.goals.home,
      away_score: apiMatch.goals.away,
      status: this.mapStatusToInternal(apiMatch.fixture.status.short)
    }));

    // Realizamos un 'upsert' masivo. Si el ID ya existe, actualiza los goles y el estado.
    const { error } = await supabase
      .from('match_results')
      .upsert(upserts, { onConflict: 'id' });

    if (error) {
      console.error("❌ Error crítico empujando datos a Supabase:", error);
      return { success: false, updatedCount: 0 };
    }

    console.log(`✅ Sincronización exitosa: ${upserts.length} partidos actualizados en BD.`);
    return { success: true, updatedCount: upserts.length };
  }

  // --- MOCK GENERATOR PARA DESARROLLO ---

  private generateMockLiveScores(fixtureIds: number[]): APIFootballFixtureResponse[] {
    return fixtureIds.map(id => {
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
}

// Exportamos una instancia única (Singleton) para usarla en toda la app
export const sportsSyncAgent = new SportsSyncAgent();
