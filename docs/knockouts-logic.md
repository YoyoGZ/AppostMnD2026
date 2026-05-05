# 🏆 Fase 7: Motor de Pronósticos Eliminatorios (Knockout Logic)

Este documento define la arquitectura para gestionar las rondas de eliminación directa, desde Dieciseisavos de Final hasta la Gran Final.

## 1. Estructura de Datos (Simulation Mode)
Dado que el torneo no ha comenzado, utilizaremos un archivo `knockout-simulation.json` para testear el flujo.

### Atributos del Partido Eliminatorio:
- `match_type`: "knockout"
- `round`: "round_of_32" | "round_of_16" | "quarter_finals" | "semi_finals" | "final"
- `allow_draw`: false (Obligatorio: El usuario debe elegir un ganador en su apuesta)
- `extra_time_support`: true
- `penalties_support`: true

## 2. Flujo de Apuestas (Lock Logic)
A diferencia de la Fase de Grupos, los partidos eliminatorios se rigen por la **Disponibilidad Real**:
1. **Bloqueo Inicial:** Los partidos de Octavos, Cuartos, etc., están bloqueados para apostar hasta que los equipos reales estén definidos en la base de datos.
2. **Identidad Dinámica:** Los placeholders (Ej: 1A) se transforman en equipos reales (Ej: MEX) mediante el Oráculo. Solo en ese momento se abre la ventana de apuestas.
3. **No Draw Policy:** La UI de apuesta eliminatoria no presentará la opción de empate. El marcador final ingresado por el usuario debe determinar un ganador claro.

## 2. Sistema de Puntuación (Propuesta)
Para las eliminatorias, el riesgo es mayor, por lo tanto, los puntos deberían escalar:

| Acierto | Puntos | Descripción |
2. **Result (90 min)** | 3 pts | Acertar G/E/P en el tiempo regular.
3. **Exact Score (90/120 min)** | 5 pts | El marcador final tras concluir el juego (incluyendo alargue si aplica).
4. **"The Survivor" (Qualifier)** | 2 pts | Bonus por acertar quién clasifica, sin importar el marcador o si fue por penales.

## 3. Lógica de Alargue y Penales
El Oráculo debe ser capaz de procesar resultados en tres tiempos:
1. **RT (Regular Time)**: Marcador a los 90'.
2. **ET (Extra Time)**: Marcador tras los 120'.
3. **PEN (Penalties)**: Ganador de la tanda.

**Regla de Oro**: El pronóstico del usuario se basa en el marcador final del partido jugado (si hubo alargue, cuenta el marcador final de los 120'). Los penales se tratan como un "Tie-breaker" para el bonus de clasificación.

## 4. Visualización de Brackets (UI/UX)
- **Mobile First**: No usaremos el clásico bracket horizontal gigante. Implementaremos una vista de "Rondas Seleccionables" o "Scroll Horizontal Infinito" con snapping para evitar fatiga visual.
- **Líneas de Conexión**: Animaciones SVG sutiles para mostrar el camino de un equipo hacia la final.

---

## ⚡ 6. Protocolo de Penales: High-Stakes (Redoble)

Cuando un partido de eliminación termina en empate tras los 120', se activa una ventana de interacción en tiempo real para los duelistas:

### Mecánica del "Doble o Nada":
1. **Detección PEN:** El Oráculo detecta el estado de penales.
2. **Ritual de Suspenso:** UI de 2 pasos (Información -> Aceptación).
3. **Escalado por Ronda:**
   - **Ronda de 32/16:** +6 pts G / -3 pts P.
   - **Cuartos/Semis:** +12 pts G / -6 pts P.
   - **Gran Final:** +20 pts G / -10 pts P.

### Lógica de Aceptación:
- **Ambos Aceptan:** Se aplican los puntos de High-Stakes (Gana el doble, Pierde del acumulado).
- **Uno Rechaza:** El que aceptó gana **5+1 pts** (Victoria técnica + Abandono). El que rechazó se lleva un Taunt de "Cobarde" 🐔. El duelo se cierra.
- **Ambos Rechazan:** Se resuelve por puntos estándar (3 pts) basados en la apuesta original de "Quién clasifica".

---

## 🛠️ 7. Cambios en el Esquema de Datos (Sprint 7.1)
- **Predictions:** Columnas `qualifier_id` y `is_winner_on_draw`.
- **League Duels:** Columna `high_stakes` (JSONB) para rastrear el estado del protocolo (Accepted/Rejected).
