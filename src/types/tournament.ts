
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
