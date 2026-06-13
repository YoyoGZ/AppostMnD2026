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

    if (useMock || !this.apiKey) {
      console.warn("[SportsSyncAgent] Uso de mocks deshabilitado o API Key ausente.");
      return null;
    }

    const apiData = await this.fetchFromApi(matchId);
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

  private async fetchFromApi(matchId: number): Promise<any> {
    // La API de deportes alternativa no tiene endpoint real implementado aquí
    console.warn("[SportsSyncAgent] fetchFromApi no implementado en el agente alternativo.");
    return null;
  }
}
