export type Team = {
  id: string;
  nombre: string;
  grupo?: string;
};

export type MatchInfo = {
  id: string | number;
  home: Team;
  away: Team;
  fase: string;
  fecha?: string;
};

export type TournamentCardProps = {
  view: "group" | "match";
  groupLetter?: string;
  teams?: Team[];
  matchInfo?: MatchInfo;
};

export type MatchStatus = "pending" | "playing" | "finished";

export interface DashboardMatchProps {
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  status: MatchStatus;
  date?: string;
  initialHomeScore?: number;
  initialAwayScore?: number;
}
