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

## 3. El Muro de Producción: Error 'Failed to Fetch' en el Despliegue (Vercel)

### Síntomas Encontrados (2026-04-29)
- **Bloqueo en Onboarding**: Tras el despliegue exitoso en Vercel, cualquier intento de registro de alias o creación de liga desde el dominio oficial resulta en una alerta roja de "Failed to Fetch". El sistema funciona perfectamente en local pero se rompe en la nube.

### Acciones de Mitigación Realizadas (Sin éxito aún)
1. **Configuración de Seguridad en Supabase**: Se actualizaron el `Site URL` y las `Redirect URLs` en el panel de Auth para incluir el dominio de Vercel (`https://appost-mn-d2026.vercel.app`).
2. **Refactorización de Orígenes en Next.js**: Se modificó `next.config.ts` para incluir explícitamente el dominio de producción en `serverActions.allowedOrigins` (bloque experimental).

### Trayectoria de Investigación para la Próxima Sesión
- **Auditoría de CORS en Navegador**: Abrir herramientas de desarrollador (F12) en la web de Vercel y verificar si el error es de "Preflight (CORS)" o de "Network Timeout".
- **Revisión de Middleware**: Analizar si el `middleware.ts` está bloqueando peticiones internas debido a la redirección de protocolo en los proxies de Vercel.
- **Supabase API Settings**: Localizar la configuración oculta de "Allowed Origins" en la sección API para permitir explícitamente el dominio `.vercel.app`.

## 4. El "Efecto Olvido" del Magic Link (Pérdida de Parámetros de Invitación)

### Síntomas Encontrados (2026-04-30)
- **Persistencia del Onboarding de Capitán**: A pesar de usar un link de invitación válido (`/?invite=XXXX`), los invitados siguen viendo la pantalla de "Funda tu Arena" en lugar de la tarjeta de bienvenida.
- **Vercel Auth (Resuelto)**: Se identificó que la protección de despliegue de Vercel bloqueaba el acceso a invitados externos. El usuario la desactivó manualmente.

### Hallazgos de Investigación (The Root Cause)
1. **Pérdida de Query Params en Redirecciones**: Se sospecha que el Middleware o el Layout del Dashboard están redirigiendo al usuario de `/` a `/dashboard` y luego a `/onboarding` **sin propagar** el parámetro `?invite=`.
2. **Resultado**: Al llegar a `/onboarding` sin el código en la URL, el componente no puede identificar la invitación y cae por defecto en el flujo de creación de liga (Capitán).

### Trayectoria de Investigación para la Próxima Sesión
- **Preservación de URL**: Modificar el Middleware (`proxy.ts`) y los `redirect()` para asegurar que cualquier parámetro `invite` se mantenga durante todo el salto de rutas.
- **Pruebas de Incógnito**: Validar el flujo desde un navegador limpio para descartar sesiones persistentes que confundan al Middleware.

