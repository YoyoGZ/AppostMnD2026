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

---

## ✅ INCIDENCIAS RESUELTAS (Deuda Técnica)

### 5. El Misterio de las Medallas (Contador de Duelos Ganados en 0)

## CORREGIDO (2026-05-04) ##

### Síntomas Encontrados (2026-05-02)
- **Contador Estático**: El contador global `duelos_ganados` en `league_members` permanecía en 0 a pesar de que el Oráculo resolvía los duelos correctamente.
- **Impacto en UX**: Las Crónicas mostraban el Taunt de nivel bajo para todos los usuarios, incluso los ganadores.

### Historial de Resolución Efectiva (Solución Aplicada — 2026-05-04)
- **Causa Raíz**: Fallo silencioso de RLS (patrón LT-1). El Step 5 del Oráculo hacía N queries individuales filtrando por `user_id` de OTROS usuarios en `duel_participants`. Al correr como Server Action con la sesión del usuario que lo dispara, RLS devolvía `count: null` silenciosamente para todos los miembros != `auth.uid()`, resultando en 0 victorias.
- **Fix**: Refactorización del Step 5 a un único **bulk fetch** de todos los ganadores de la liga, sin filtrar por `user_id` en la DB. La agregación ocurre en memoria con un `Map<userId, victories>`. Esto elimina la dependencia de permisos por `user_id`.
- **Acción SQL Pendiente**: Ejecutar el script `docs/sql-migrations/fix-duelos-rls.sql` en Supabase para garantizar las políticas correctas en `duel_participants` y `league_duels`.

---

## 🔶 PENDIENTES DE REVISIÓN (Sesión 2026-05-14)

### 6. Diferencia de Color Primario entre Dispositivos (Dorado vs Marrón)

### Síntomas Reportados
- En celulares de misma marca pero distinto modelo, el color `#fbbf24` se ve marrón-ámbar en vez del dorado esperado.
- No se reproduce en todos los dispositivos — depende del tipo de pantalla.

### Diagnóstico
- Color definido correctamente en hex sRGB. Sin uso de `oklch()`.
- Causa probable: diferencia de renderizado entre pantallas **AMOLED** y **LCD**. Las AMOLED con saturación o temperatura cálida desplazan el dorado hacia ámbar/marrón.

### Solución Recomendada
1. Probar ajustando el valor hex del primary hacia la paleta *Yellow* para "enfriarlo" y compensar la sobresaturación de las pantallas AMOLED:
   - Actual: `--primary: #fbbf24` (Amber-400 — contiene demasiado rojo para AMOLED)
   - Propuesta: `--primary: #eab308` (Yellow-500) o `--primary: #facc15` (Yellow-400 — oro más puro)
2. Validar en ambos dispositivos antes de hacer push.
3. Si persiste, evaluar `@media (color-gamut: p3)` con un color alternativo para pantallas de gama amplia.

---

### 7. Alerta de "Sitio Malicioso" al Acceder desde URL de Vercel

### Síntomas Reportados
- Al abrir la URL `.vercel.app` desde un desktop ajeno, el browser/antivirus mostró alerta de "sitio malicioso".
- No se reproduce en los propios dispositivos de desarrollo.

### Diagnóstico
- El dominio `vercel.app` es confiable. La alerta NO es por el dominio en sí.
- Causas probables:
  1. **Antivirus corporativo o extension de browser** del equipo ajeno bloqueando URLs desconocidas.
  2. **Google Safe Browsing heurístico**: las rutas `/vip/[token]` y `/join/[code]` son patrones similares al phishing — el sistema las analiza automáticamente hasta verificar legitimidad.
  3. **Sin historial de reputación** para la URL de staging provisional.

### Solución Recomendada
1. **Verificar estado en Google Safe Browsing**: `https://transparencyreport.google.com/safe-browsing/search` — ingresar la URL de Vercel. Si está marcada, completar el formulario de revisión.
2. **Solución definitiva — Dominio propio**: Conectar un dominio final (ej: `mundialapp.com`) en Vercel → Settings → Domains. Los dominios `.com` con SSL de Vercel eliminan el problema de reputación de forma permanente.
3. **Mientras tanto**: Indicar a testers que es un falso positivo y usar Chrome/Firefox sin extensiones de seguridad activas para las pruebas.


