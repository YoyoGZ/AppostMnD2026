# 🧠 Lessons Learned

Registro obligatorio de conocimiento arquitectónico post-mortem.

## 2026-04-28: El Agujero Negro de Puntos (LT-1) y Fallos RLS Silenciosos

### Síntoma
El sistema de puntuación ("El Oráculo") procesaba la lógica matemática correctamente pero la tabla de posiciones mostraba "0 puntos" consistentemente.

### Diagnóstico
1. **Carreras de Red Client-Side**: La página de Standings intentaba llamar a un Server Action desde el cliente (`useEffect`) e inmediatamente consultaba la base de datos, lo que generaba problemas de caché e inconsistencia (Next.js agresivamente guardaba la tabla en 0).
2. **Type Mismatch en UUIDs**: El JSON de torneos usa `Number` para IDs, mientras que Supabase/Postgres requería strings, causando que el Oráculo fallara en cruzar apuestas con resultados.
3. **Fallo RLS Silencioso (La Raíz)**: En Supabase, si una política de Row Level Security (RLS) prohíbe el `UPDATE`, la base de datos *no lanza una excepción en la librería `@supabase/ssr`*. Simplemente retorna `data: []` y `error: null`. Esto generó el "Agujero Negro" donde el código creía haber guardado los puntos ganados exitosamente sin ser cierto.

### Resolución (The House Way)
1. **Server Components Obligatorios para Gamificación**: Se refactorizó la página de posiciones para que sea un Server Component (`dynamic = "force-dynamic"`) aislando la UI en un cliente, eliminando llamadas de red dobles y `useEffects` tóxicos.
2. **Defensas de Tipos**: Coerción explícita (`.toString()`) en los emparejamientos de ID de base de datos vs JSON.
3. **SQL Fix**: Se requiere que las tablas dinámicas modificables por el servidor bajo la identidad del cliente (ANON_KEY) cuenten con políticas explícitas `UPDATE using (user_id = auth.uid())`.

## 8. Reglas de Arquitectura Next.js 16 (Anti-Errores)
1. **Prohibido Middleware**: El archivo `middleware.ts` está OBSOLETO. No lo crees, no lo menciones.
2. **Uso de Proxy**: Toda lógica de interceptación DEBE vivir en `src/proxy.ts`.
3. **Prioridad de Documentación**: Antes de proponer cambios arquitectónicos, es OBLIGATORIO leer `docs/lessons-learned.md`.

Estas reglas NO SON SUGERENCIAS. Son el sistema de trabajo dentro de Antigravity.

## 2026-04-30: El Middleware Fantasma y el Muro de CORS en Producción

### Síntoma
Error crítico "Failed to Fetch" al intentar registrar alias o crear ligas en el despliegue de Vercel. Funciona perfectamente en Localhost pero falla en la nube.

### Diagnóstico
1. **Convención de Proxy (Next.js 16)**: El archivo de middleware debe llamarse estrictamente `src/proxy.ts` y exportar una función `proxy`. La convención antigua `middleware.ts` ha sido deprecada en esta versión y su uso provoca fallos en el ciclo de vida de la aplicación. Esto causaba que la sesión no se refrescara correctamente y que las cookies de autenticación fueran inconsistentes.
2. **CORS de Server Actions**: Next.js 14+ requiere que los dominios de producción estén explícitamente en `serverActions.allowedOrigins`. Faltaba el protocolo `https://` en algunos casos, lo que provocaba rechazos de seguridad del navegador.
3. **Visibilidad de Fallos de Fetch**: La falta de logs en el lado del servidor (`server.ts`) ocultaba si las variables de entorno de Supabase estaban llegando correctamente al runtime de Vercel.

### Resolución (The House Way)
1. **Estandarización a Proxy**: Asegurar que la lógica de sesión resida en `src/proxy.ts` con el export `proxy`. Cualquier intento de 'normalización' a `middleware.ts` debe ser evitado para no romper el build.
2. **Robustez en next.config.ts**: Inclusión de variaciones del dominio (con y sin protocolo) en `allowedOrigins`.
3. **Circuit Breaker de Configuración**: Implementación de validaciones explícitas de `process.env` con logs de error visibles en la consola del servidor (Vercel Logs).
4. **Acción Manual Requerida**: Se debe verificar en el Dashboard de Supabase que el dominio de Vercel esté en la lista blanca de CORS (API Settings).


## 2026-04-30: El Error de Prerender y el Muro de Vercel (Deployment Protection)

### Sntoma
1. El build de Vercel fall con un error crptico: Error occurred prerendering page /onboarding.
2. Invitados externos vean una pantalla de Sign in to Vercel antes de llegar a la aplicacin.

### Diagnstico
1. Suspense para useSearchParams: Next.js 15+ requiere que cualquier componente que use useSearchParams() en una ruta esttica est envuelto en un lmite de <Suspense>. Sin esto, el motor de construccin intenta renderizar la pgina como esttica y falla porque los parmetros de bsqueda son dinmicos.
2. Vercel Authentication: Por defecto, los despliegues de Preview (y a veces produccin en planes Pro) activan la Vercel Authentication. Esto bloquea a cualquier persona que no est logueada en Vercel, impidiendo el uso de Magic Links por usuarios externos.

### Resolucin (The House Way)
1. Estructura de Componente Dinámico: Se refactorizaron las pginas de Onboarding y Login para mover la lgica de parmetros a sub-componentes envueltos en Suspense.
2. Gestin de Plataforma: Desactivar Deployment Protection -> Vercel Authentication en los settings del proyecto en Vercel para permitir acceso pblico a invitados.

## 2026-05-01: El Bloqueo del Candado (SSR Lock Collision) y el Muro RLS en Transacciones Atómicas

### Síntoma 1: Lock "sb-...-auth-token" was released because another request stole it
Al entrar a la pantalla de Partidos (`/matches`), la App crasheaba con este error de Supabase proveniente de la librería de autenticación.

### Diagnóstico 1
Las tarjetas de predicción de partidos se renderizaban iterando sobre un Array (ej. 6 tarjetas por grupo). En su `useEffect` interno, cada una llamaba a `supabase.auth.getUser()` al montarse. Al intentar 6 componentes leer y validar la sesión local en el mismo exacto milisegundo, peleaban por el "Lock" del localStorage del navegador, causando que Supabase entrara en pánico.

### Resolución 1 (The House Way)
**"Single Source of Truth" para SSR Auth**. Los componentes renderizados en lista (iteraciones) **nunca** deben pedir sesiones independientemente. Se debe elevar el `getUser()` al componente Padre (ej. `MatchesPage.tsx`), almacenar el `userId` y pasarlo como Prop a las tarjetas hijas.

### Síntoma 2: No autorizado para "quemar" el token
El sistema de Monetización requería que un usuario se registrara usando un Golden Pass (URL). Tras el éxito del `signUp`, el código intentaba hacer un `UPDATE` en la tabla `access_tokens` para poner `is_used = true`. La base de datos denegaba el acceso (aunque el código estuviera bien).

### Diagnóstico 2
El Server Action corría usando las credenciales recién creadas del usuario (`auth.uid()`), y no con el rol de `super_admin`. La política RLS impedía a un usuario mortal hacer un UPDATE sobre la tabla de tokens maestros.

### Resolución 2 (The House Way)
Se construyó una política RLS quirúrgica: `UPDATE USING (is_used = false) WITH CHECK (is_used = true AND used_by = auth.uid())`. Esto permite al usuario modificar el token **solo** en el momento de consumirlo para quemarlo y atarlo a su cuenta, sin comprometer el resto de la base de datos. Se logró transaccionalidad atómica sin necesidad de exponer la `SERVICE_ROLE_KEY`.

## 2026-05-04: El Misterio de las Medallas — N+1 RLS Block en Iteraciones Multi-User (LT-2)

### Síntoma
`duelos_ganados` permanecía en 0 para todos los miembros de la liga después de ejecutar el Oráculo, a pesar de que `is_winner = true` se grababa correctamente en `duel_participants`.

### Diagnóstico
El Step 5 del Oráculo iteraba sobre todos los miembros de la liga y ejecutaba una query de conteo en `duel_participants` **filtrando por `user_id` de otros usuarios**: `.eq('user_id', member.user_id)`. El Oráculo corre como Server Action con la sesión del usuario que lo dispara (`auth.uid()`). Si la política RLS de `duel_participants` usa `user_id = auth.uid()`, la query devuelve `count: null` silenciosamente para cualquier miembro que no sea el usuario actual. Esto es una variante del patrón LT-1 (Silent RLS Failure) aplicado a **iteraciones multi-usuario**.

### Resolución (The House Way)
**Anti-Patrón a Evitar**: Nunca hacer N queries individuales sobre tablas con RLS, filtrando por `user_id` de otros usuarios en un loop de iteración.

**La Regla**: Cuando un proceso del servidor necesita datos de MÚLTIPLES usuarios en simultáneo (como el Oráculo), usar siempre un **bulk fetch** filtrando por un ID que SÍ tienes permiso de leer (ej. `duel_id`, `league_id`), y agregar los resultados en memoria con un `Map`.

```typescript
// ❌ PATRÓN PELIGROSO (N queries, bloqueable por RLS):
for (const member of members) {
  const { count } = await supabase
    .from('duel_participants')
    .select('*', { count: 'exact' })
    .eq('user_id', member.user_id) // ← bloqueado por RLS para otros users
    .eq('is_winner', true);
}

// ✅ PATRÓN SEGURO (1 query, agregación en memoria):
const { data: allWinners } = await supabase
  .from('duel_participants')
  .select('user_id')
  .eq('is_winner', true)
  .in('duel_id', allLeagueDuelIds); // ← filtra por ID que SÍ puedes leer

const victoriesMap = new Map();
(allWinners || []).forEach(w => {
  victoriesMap.set(w.user_id, (victoriesMap.get(w.user_id) || 0) + 1);
});
```

## 2026-05-14: El Incidente del 404 y la Deprecación Crítica del Middleware

### Síntoma
Error 404 persistente al intentar acceder a rutas que deberían existir (como `/login`) y fallo de compilación: `Both middleware file and proxy file are detected`.

### Diagnóstico
1. **Conflicto de Identidad**: En Next.js 16, el motor de rutas ha eliminado el soporte para `middleware.ts`. El uso de `proxy.ts` no es solo una sugerencia, es el **único** punto de entrada permitido para la interceptación de peticiones.
2. **Error de Agente**: Intentar "corregir" la arquitectura creando un archivo `middleware.ts` rompe el ciclo de vida de Next.js, provocando que el servidor de desarrollo entre en un estado de pánico que resulta en 404s para rutas válidas.

### Resolución (The House Way)
1. **REGLA DE ORO**: Nunca crear archivos `middleware.ts`. El archivo `src/proxy.ts` es el soberano absoluto de la lógica de sesión y protección.
2. **Eliminación Total**: Cualquier vestigio de `middleware.ts` debe ser purgado de inmediato para permitir que el compilador de Next.js 16 procese el `proxy.ts`.
3. **Persistencia de Aprendizaje**: Si una ruta da 404, el primer paso de diagnóstico debe ser verificar que NO existan archivos `middleware.ts` duplicando la lógica de `proxy.ts`.

## 2026-05-17: La Trampa de Producción de Mercado Pago ("Una de las partes es de prueba")

### Síntoma
Al probar el Checkout Pro con credenciales de Producción (`APP_USR-`) y una tarjeta de crédito real, Mercado Pago rechaza el pago inmediatamente con el error: *"Algo salió mal... Una de las partes con la que intentás hacer el pago es de prueba"*.

### Diagnóstico
La integración del código y el Webhook estaban correctos. El fallo fue 100% administrativo/antifraude. Hay dos causas exclusivas para este error:
1. **Falta de Homologación:** La cuenta vendedora (el dueño de las llaves `APP_USR`) no completó el formulario de Producción en el panel de Mercado Pago Developers (Rubro, Sitio Web, etc.). Las llaves, aunque sean de producción, actúan secretamente como Sandbox para externos.
2. **Auto-financiamiento (Fraude):** El desarrollador intentó pagarse a sí mismo usando una tarjeta de crédito a su nombre. Mercado Pago cruza DNI, IP y datos bancarios, y bloquea la operación instantáneamente.

### Resolución (The House Way)
1. Completar rigurosamente el formulario de Producción en el panel de MP.
2. Para pruebas "Live" con dinero real, **NUNCA usar medios de pago propios**. Se requiere que un tercero (amigo/familiar) con otra cuenta de Mercado Pago realice el pago, o utilizar credenciales explícitamente `TEST-` con las tarjetas falsas provistas por MP.

## 2026-05-18: Fidelidad de Renderizado en Iconos PWA y Alternativa PNG para Logos (LT-3)

### Síntoma
Al generar o actualizar el logo oficial de la aplicación, el script `generate-icons.mjs` (utilizando la librería Sharp) desdibuja o pierde degradados y efectos de brillo vectoriales complejos presentes en el SVG original, resultando en iconos de baja calidad visual o rotos.

### Diagnóstico
La librería `sharp` y el renderizador SVG subyacente (librsvg) en entornos Node no soportan completamente la gama de propiedades modernas de vectores complejos (degradados no estándar, sombras, efectos glow por CSS SVG, etc.). Al rasterizar un SVG complejo a PNG para los iconos de la PWA (`icon-192x192.png`, `icon-512x512.png`, `favicon.png`), estos detalles se pierden o distorsionan.

### Resolución (The House Way)
1. **Alternativa PNG nativa**: El logo principal **SÍ se puede dejar en formato PNG de alta resolución** (ej. `public/logo.png`) en lugar de `.svg`.
2. **Implementación de logo PNG**:
   - Guardar el logo definitivo en `public/logo.png`.
   - Modificar las referencias de `src="/logo.svg"` a `src="/logo.png"` en componentes como `/src/app/page.tsx` y `TicketClient.tsx`.
   - Ajustar el script `scripts/generate-icons.mjs` reemplazando la constante `INPUT` para que lea `public/logo.png` directamente: `const INPUT = path.join(ROOT, 'public', 'logo.png');`. Como la fuente de entrada ya es un mapa de bits PNG renderizado a alta calidad, Sharp realizará el escalado a los iconos de PWA e iconos `favicon.png` de manera impecable y nítida.
3. **Restauración de Escudo Temporal**:
   - Se copió la versión vectorial limpia del escudo provisorio con estrella dorada (`src/app/icon.svg`) como el logo oficial provisional (`public/logo.svg`).
   - Se ejecutó `node scripts/generate-icons.mjs` regenerando de manera exitosa y nítida todos los iconos PWA y favicons, confirmando su estabilidad y renderizado correcto en `localhost:3000`.

