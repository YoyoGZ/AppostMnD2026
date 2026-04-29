/**
 * Motor de Puntuación "El Oráculo" - Versión 5 Puntos
 * Calcula los puntos ganados comparando la predicción del usuario con el resultado real.
 */

export function calculatePoints(
  predLocal: number,
  predVisitante: number,
  realLocal: number,
  realVisitante: number
): { puntos: number; aciertoSimple: boolean; plenoExacto: boolean } {
  const predDiff = predLocal - predVisitante;
  const realDiff = realLocal - realVisitante;

  const isPredEmpate = predDiff === 0;
  const isRealEmpate = realDiff === 0;

  // 1. Verificar el marcador exacto (Bono de +3)
  const isExact = predLocal === realLocal && predVisitante === realVisitante;
  
  // 2. Verificar si acertó la tendencia (Base de +2)
  const isTrendCorrect =
    (predDiff > 0 && realDiff > 0) || // Acertó Ganador Local
    (predDiff < 0 && realDiff < 0) || // Acertó Ganador Visitante
    (isPredEmpate && isRealEmpate);   // Acertó Empate

  let puntos = 0;
  let aciertoSimple = false;
  let plenoExacto = false;

  // Cálculo de Puntos Acumulativo
  if (isTrendCorrect) {
    puntos += 2; // Base por tendencia
    aciertoSimple = true;
  }

  if (isExact) {
    puntos += 3; // Bono por exactitud
    plenoExacto = true;
  }

  return { puntos, aciertoSimple, plenoExacto };
}
