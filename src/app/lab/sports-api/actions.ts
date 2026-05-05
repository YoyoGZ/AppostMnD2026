'use server'

import { SportsSyncAgent } from "@/lib/sports-api/SportsSyncAgent";

export async function triggerManualSync(matchId: number) {
  const agent = SportsSyncAgent.getInstance();
  return await agent.syncMatch(matchId, true); // true para forzar mock en pruebas
}
