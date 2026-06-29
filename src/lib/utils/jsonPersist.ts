import fs from 'fs';
import path from 'path';

/**
 * Persiste de forma definitiva el resultado de un partido finalizado en el JSON local world-cup-2026.json.
 * En entornos Serverless de producción (como Vercel) fallará silenciosamente debido a que el sistema de archivos
 * es de solo lectura, lo cual es correcto ya que en producción la fuente de verdad activa es Supabase.
 * En desarrollo local (máquina del programador), actualizará el archivo del repositorio para que se guarde en git.
 */
export function persistMatchResultToLocalJson(matchId: number, golesLocal: number, golesVisitante: number) {
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'world-cup-2026.json');
    if (!fs.existsSync(jsonPath)) {
      console.warn(`[Local JSON Persist] No se encontró el archivo de configuración de partidos en la ruta: ${jsonPath}`);
      return;
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    const match = data.partidos.find((p: any) => p.id === matchId);
    if (match) {
      // Si ya está marcado como finalizado con los mismos goles, no volvemos a escribir (evita toques del watch)
      if (match.estado === 'finalizado' && match.goles_local === golesLocal && match.goles_visitante === golesVisitante) {
        return;
      }

      match.estado = 'finalizado';
      match.goles_local = golesLocal;
      match.goles_visitante = golesVisitante;

      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[Local JSON Persist] ✅ Partido ${matchId} persistido localmente en world-cup-2026.json (${golesLocal} - ${golesVisitante})`);
    }
  } catch (err: any) {
    // Capturar silenciosamente en producción (read-only filesystem)
    console.warn(`[Local JSON Persist] Ignorando persistencia local para partido ${matchId} (Sistema de archivos Read-Only en producción):`, err.message);
  }
}

export function persistKnockoutMatchResultToLocalJson(matchId: number, golesLocal: number, golesVisitante: number, fecha?: string) {
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'knockouts-simulation.json');
    if (!fs.existsSync(jsonPath)) {
      console.warn(`[Local Knockout JSON Persist] No se encontró el archivo en la ruta: ${jsonPath}`);
      return;
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    let matchFound = false;

    for (const rond of data.rondas) {
      const match = rond.partidos.find((p: any) => p.id === matchId);
      if (match) {
        // Evita toques del watch si no hay cambios reales
        const isSameResult = match.estado === 'finalizado' && match.goles_local === golesLocal && match.goles_visitante === golesVisitante;
        const isSameDate = !fecha || match.fecha === fecha;
        if (isSameResult && isSameDate) {
          return;
        }

        match.estado = 'finalizado';
        match.goles_local = golesLocal;
        match.goles_visitante = golesVisitante;
        if (fecha) {
          match.fecha = fecha;
        }
        matchFound = true;
        break;
      }
    }

    if (matchFound) {
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[Local Knockout JSON Persist] ✅ Partido de Eliminatorias ${matchId} persistido localmente en knockouts-simulation.json (${golesLocal} - ${golesVisitante})`);
    }
  } catch (err: any) {
    console.warn(`[Local Knockout JSON Persist] Ignorando persistencia local para partido de eliminatorias ${matchId}:`, err.message);
  }
}

export function persistKnockoutMatchDateToLocalJson(matchId: number, fecha: string) {
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'knockouts-simulation.json');
    if (!fs.existsSync(jsonPath)) return;

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    let matchFound = false;

    for (const rond of data.rondas) {
      const match = rond.partidos.find((p: any) => p.id === matchId);
      if (match) {
        if (match.fecha === fecha) return; // Sin cambios
        match.fecha = fecha;
        matchFound = true;
        break;
      }
    }

    if (matchFound) {
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[Local Knockout JSON Persist] 📅 Fecha del partido ${matchId} actualizada a ${fecha} en knockouts-simulation.json`);
    }
  } catch (err: any) {
    console.warn(`[Local Knockout JSON Persist] Ignorando actualización de fecha local para partido ${matchId}:`, err.message);
  }
}
