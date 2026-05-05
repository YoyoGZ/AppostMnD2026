export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed';

export interface MatchResult {
  id: number;
  api_fixture_id?: number;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  elapsed: number;
  last_sync: string;
}

export interface ApiFootballResponse {
  fixture: {
    id: number;
    status: {
      short: string;
      elapsed: number;
    };
  };
  goals: {
    home: number;
    away: number;
  };
}
