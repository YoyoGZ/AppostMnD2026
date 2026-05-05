# Feature: Motor de Duelos (Side-Quests)

## 1. Visión del Producto
Los "Duelos" son micro-competiciones (Head-to-Head) internas dentro de una liga. Diseñadas para maximizar el "engagement" diario y el componente social (trash-talk) independientemente de la posición del usuario en la tabla general.

## 2. Reglas de Negocio
- **El Creador (Bookie):** Solo el Capitán Fundador de la Liga puede crear un Duelo.
- **Participantes:** El Capitán selecciona a 2 o más integrantes de la liga.
- **El Ring:** Se elige un partido específico del Fixture.
- **Las Armas (Pronósticos):** El sistema arrastra automáticamente los pronósticos que los duelistas ya cargaron en sus propios Fixtures. No hay carga manual por parte del Capitán.
- **Recompensas:** Honor y Status. Se crea un ranking paralelo de duelos ganados con insignias (ej. "El Capo del Fixture" 👑, "Racha Letal" 🔥). No hay transferencia de puntos de la tabla general.

## 3. Arquitectura (Data Layer)
Necesitaremos crear 2 nuevas tablas en Supabase:

### Tabla `league_duels`
- `id` (uuid, PK)
- `league_id` (uuid, FK a leagues)
- `match_id` (string, ref al id del partido en el JSON)
- `created_by` (uuid, FK a users - Capitán)
- `status` (text: 'pending', 'active', 'resolved')
- `created_at` (timestamp)

### Tabla `duel_participants`
- `duel_id` (uuid, FK a league_duels)
- `user_id` (uuid, FK a users)
- `is_winner` (boolean, default: false)

*(Nota: Los pronósticos reales vivirán en la tabla `predictions` original, y se consultarán mediante el `match_id` y `user_id`).*

## 4. Diseño UI/UX
- **Admin HQ (Capitán):** Un modal "Crear Duelo" con un flujo rápido: Seleccionar Partido -> Seleccionar Duelistas -> Armar Ring.
- **Dashboard (El Coliseo):** Un Bento Grid horizontal en la vista principal donde todos los miembros de la liga ven las tarjetas de los Duelos.
- **Tarjeta de Duelo:** Muestra los avatares enfrentados (V/S), el partido, y oculta los pronósticos hasta que comience el partido (para respetar el Time-lock de la Fase 3). Al finalizar, resalta al ganador con animaciones "Premium".

## 5. Plan de Ejecución
1. **Data Architect:** Esquema Supabase (Tablas, RLS, Relaciones).
2. **Builder:** Server Actions (`createDuel`, `getLeagueDuels`).
3. **Design Lead:** UI del "Coliseo" (Bento Cards de V/S) y Modal del Capitán.
4. **Integrity Specialist:** Lógica del "Oráculo" para resolver el duelo cuando el partido termina, asignando la victoria y las insignias.

---

## 🚀 6. Expansiones Futuras: Prop-Bets & Side-Quests (Idea Fase 7+)

Para evitar el desinterés en los partidos de la Jornada 3 (donde ya hay equipos eliminados), el Capitán podrá proponer duelos basados en **estadísticas específicas** proporcionadas por la API:

### Nuevos Tipos de Desafíos:
- **Batalla de Corners:** ¿Quién acierta qué equipo tendrá más tiros de esquina?
- **El Juez de Hierro:** ¿Habrá más de 3 tarjetas amarillas en el encuentro?
- **Punto Penal:** ¿Se pitará algún penal a favor del Equipo A?
- **Muro Defensivo:** ¿El Equipo B mantendrá su portería a cero?

### Requisitos Técnicos:
- Sincronización extendida en `match_results` para capturar `corners`, `yellow_cards`, `red_cards` y `penalties`.
- Interfaz dinámica de creación de duelos que permita al Capitán elegir el "Modo de Juego" (Clásico vs Side-Quest).

