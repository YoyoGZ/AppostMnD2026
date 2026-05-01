# Registro de Incidencias No Resueltas (Problems.md)

Este documento centraliza los problemas técnicos y bugs encontrados durante el desarrollo que han sido pausados temporalmente. Sirve como Master Log para una intervención táctica futura.

## 1. Fricciones en la Experiencia Mobile (MatchPredictionCard & GroupsCarousel)

## CORREGIDO ## 
### Síntomas Encontrados
- ~~**Carrusel Estático**: El componente `GroupsCarousel` se rehúsa a responder al deslizamiento táctil horizontal (swipe) en dispositivos móviles, inmovilizando la navegación de grupos.~~
- ~~**Inputs Congelados (Pronósticos)**: El ingreso de dígitos en los campos de puntuación de `MatchPredictionCard` a través del teclado del celular NO desencadena la hidratación del estado (es decir, no aparece en el footer la confirmación "¿Apostar X a Y?").~~

### Historial de Resolución Efectiva (Solución Aplicada)
1. **El falso bug de los Client Components:** Se descubrió que el origen primario de la "congelación" no era de código, sino una política de seguridad estricta de Next.js (Turbopack) que bloqueaba la descarga de Javascript (HMR) a través de conexiones de red local (Wi-Fi).
2. **Refactorización de Interfaz y Eventos:** Se inyectó la IP local en `allowedDevOrigins` (`next.config.ts`), liberando la hidratación. Paralelamente se transformó la UX de renderizado masivo en una arquitectura segmentada (grid de 12 selectores por grupo), acabando con la pesadilla de scroll infinito.

## CORREGIDO ## 
### 2. El Oráculo y el Agujero Negro de Puntos (Standings/Leaderboard)

### Síntomas Encontrados
- ~~**El Puntaje "0" Persistente**: A pesar de que el motor de `oracle.ts` procesa el resultado simulado y el boleto es sellado correctamente en la base de datos de Supabase, la tabla de `league_members` (`total_pts`) no absorbe el puntaje y la interfaz (`/standings`) continúa renderizando 0 puntos para el gladiador.~~

### Historial de Resolución Efectiva (Solución Aplicada)
1. **Fallo Silencioso del RLS (Supabase)**: Se comprobó a través de telemetría inyectada en el servidor que la base de datos estaba ignorando silenciosamente (sin arrojar excepciones en `@supabase/ssr`) las actualizaciones a las tablas `predictions` y `league_members` por falta de permisos `UPDATE` en las políticas RLS del usuario autenticado. Se le delegó al administrador la ejecución del comando SQL para habilitar la actualización.
2. **Reingeniería de Arquitectura (Server Components)**: Se migró la página de Standings de Client Component con `useEffect` a Server Component Puro con paso de datos pre-hidratados al cliente (`StandingsClient.tsx`). Se eliminaron las carreras de datos, el caché envenenado de Next.js, y se garantizó la sincronización perfecta del Oráculo antes del renderizado.
3. **Inmunidad de Tipos**: Se forzó la coerción a `.toString()` al cruzar IDs de partidos entre el JSON y Postgres para evitar descarte de operaciones por Type Mismatches.

## CORREGIDO ## 
### 3. El Muro de Producción: Error 'Failed to Fetch' en el Despliegue (Vercel)

### Historial de Resolución Efectiva (Solución Aplicada)
1. **Configuración de Dominios**: Se incluyó el dominio de Vercel con y sin protocolo en `serverActions.allowedOrigins`.
2. **Normalización de Middleware**: Se estandarizó el uso de `src/proxy.ts` (Next.js 16/Antigravity standard) asegurando que el build de Vercel no fallara por inconsistencias de sesión.

## CORREGIDO ## 
### 4. El "Efecto Olvido" del Magic Link (Pérdida de Parámetros de Invitación)

### Síntomas Encontrados (2026-04-30)
- **Persistencia del Onboarding de Capitán**: Invitados veían "Funda tu Arena" por error.
- **Pérdida de Query Params**: Redirecciones del Middleware borraban el `?invite=`.

### Historial de Resolución Efectiva (Solución Aplicada)
1. **Arquitectura de Rutas Dedicadas**: Se abandonó el uso de parámetros URL (`?invite=`) para el flujo crítico. Se implementó la ruta estática `/join/[code]`, que es indestructible y resistente a redirecciones de sesión.
2. **Unificación de Flujo**: Se creó `JoinClient.tsx` que maneja tanto a invitados anónimos (registro + unión en un paso) como a usuarios logueados (unión directa), eliminando el "limbo" de redirección.
3. **Purga de Middleware**: Se eliminó toda la lógica de invitaciones de `src/utils/supabase/middleware.ts`, delegando la responsabilidad a la ruta dedicada.

---
## 🚀 PRÓXIMOS DESAFÍOS (Fase 3: Gamificación & Seguridad)
- **Sincronización de Resultados Reales**: Conectar el Oráculo con una API de deportes o un JSON maestro actualizado.
- **Seguridad de Pronósticos**: Implementar el Shield Protocol para evitar cambios de apuestas post-inicio de partido.
