
export type Team = {
  id: string;
  nombre: string;
  grupo: string;
  bunker: string;
};

export type MatchStatus = "pending" | "playing" | "finished" | "bloqueado";

export interface DashboardMatchProps {
  homeTeam: string;
  awayTeam: string;
  status: "pending" | "playing" | "finished";
  date?: string;
  initialHomeScore?: number;
  initialAwayScore?: number;
}

export interface TournamentCardProps {
  view: "group" | "match";
  groupLetter?: string;
  teams?: Team[];
  matchInfo?: MatchInfo;
}

export type TeamStanding = {
  teamId: string;
  nombre: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  grupo: string;
};

export type MatchInfo = {
  id: string;
  fase: string;
  fecha: string;
  home: { id: string; nombre: string };
  away: { id: string; nombre: string };
};

// --- API-FOOTBALL V3 INTEGRATION TYPES ---

export interface APIFootballFixtureResponse {
  fixture: {
    id: number;
    status: {
      short: string; // 'NS' (Not Started), '1H', 'HT', '2H', 'FT' (Finished), 'PEN' (Penalties)
      elapsed: number | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}
