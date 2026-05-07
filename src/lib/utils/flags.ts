
/**
 * Utilidad centralizada para el manejo de banderas y nombres de equipos.
 * Basado en estándares FIFA y FlagCDN.
 */

export const FIFA_TO_ISO: Record<string, string> = {
  // Grupo A
  'MEX': 'mx', 'RSA': 'za', 'KOR': 'kr', 'CZE': 'cz',
  // Grupo B
  'CAN': 'ca', 'SUI': 'ch', 'QAT': 'qa', 'BIH': 'ba',
  // Grupo C
  'BRA': 'br', 'MAR': 'ma', 'SCO': 'gb-sct', 'HAI': 'ht',
  // Grupo D
  'USA': 'us', 'PAR': 'py', 'AUS': 'au', 'TUR': 'tr',
  // Grupo E
  'GER': 'de', 'ECU': 'ec', 'CIV': 'ci', 'CUW': 'cw',
  // Grupo F
  'NED': 'nl', 'JPN': 'jp', 'TUN': 'tn', 'SWE': 'se',
  // Grupo G
  'BEL': 'be', 'EGY': 'eg', 'IRN': 'ir', 'NZL': 'nz',
  // Grupo H
  'ESP': 'es', 'URU': 'uy', 'KSA': 'sa', 'CPV': 'cv',
  // Grupo I
  'FRA': 'fr', 'SEN': 'sn', 'NOR': 'no', 'IRQ': 'iq',
  // Grupo J
  'ARG': 'ar', 'ALG': 'dz', 'AUT': 'at', 'JOR': 'jo',
  // Grupo K
  'POR': 'pt', 'COL': 'co', 'UZB': 'uz', 'COD': 'cd',
  // Grupo L
  'ENG': 'gb-eng', 'CRO': 'hr', 'GHA': 'gh', 'PAN': 'pa'
};

export const getTeamFlagUrl = (teamId: string | null) => {
  if (!teamId) return null;
  const id = teamId === 'ZA' ? 'RSA' : teamId;
  const iso = FIFA_TO_ISO[id];
  if (!iso) return null;
  return `https://flagcdn.com/w160/${iso}.png`;
};

export const normalizeFIFAId = (id: string) => {
  return id === 'ZA' ? 'RSA' : id;
};
