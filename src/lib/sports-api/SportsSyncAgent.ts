import { createAdminClient } from '@/utils/supabase/admin';
import { MatchResult, MatchStatus } from '@/types/sports-api';

export class SportsSyncAgent {
  private static instance: SportsSyncAgent;
  private apiKey: string | undefined;

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_SPORTS_API_KEY;
  }

  public static getInstance(): SportsSyncAgent {
    if (!SportsSyncAgent.instance) {
      SportsSyncAgent.instance = new SportsSyncAgent();
    }
    return SportsSyncAgent.instance;
  }

  /**
   * Sincroniza un partido específico consultando la API (o mock)
   * y actualizando Supabase de forma automática.
   */
  async syncMatch(matchId: number, useMock: boolean = false): Promise<MatchResult | null> {
    console.log(`[SportsSyncAgent] Sincronizando partido ${matchId}...`);

    let apiData;

    if (useMock || !this.apiKey) {
      apiData = this.getMockData(matchId);
    } else {
      apiData = await this.fetchFromApi(matchId);
    }

    if (!apiData) return null;

    // Persistir en Supabase usando el Cliente Admin (Superusuario)
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('match_results')
      .upsert({
        id: matchId,
        status: apiData.status,
        home_score: apiData.home_score,
        away_score: apiData.away_score,
        elapsed: apiData.elapsed,
        last_sync: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error(`[SportsSyncAgent] Error actualizando Supabase:`, error);
      return null;
    }

    return data as MatchResult;
  }

  private async fetchFromApi(matchId: number) {
    // Aquí irá la lógica real de fetch a API-Football una vez configurada la Key
    // Por ahora redirige al mock si no hay Key
    return this.getMockData(matchId);
  }

  private getMockData(matchId: number) {
    // Simulación de un partido en vivo (minuto aleatorio y goles)
    const statuses: MatchStatus[] = ['live', 'halftime', 'live', 'finished'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      home_score: Math.floor(Math.random() * 3),
      away_score: Math.floor(Math.random() * 2),
      elapsed: Math.floor(Math.random() * 90),
    };
  }
}
