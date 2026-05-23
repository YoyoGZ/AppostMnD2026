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

## 2026-05-18: Gestión de Cambios Dinámicos de Precios y Restricciones de Copyright (LT-4)

### Síntoma
1. **Riesgo Legal (Copyright)**: El uso de marcas y términos de torneos oficiales (ej: "Mundial 2026", "Copa Mundial FIFA") genera riesgos de infracción de propiedad intelectual.
2. **Fricción en Entornos de Pruebas**: Cambiar los valores de los productos en la pasarela de pagos (de $50.000 para producción a $20 para pruebas) requería alterar variables de entorno de Next.js, forzando redespliegues lentos en Vercel.

### Diagnóstico
1. **Unificación de Marca**: La app debe usar nombres propios y exclusivos (ej: **MundiApp26**). Esto elimina la necesidad de usar marcas comerciales registradas en títulos de páginas, metadatos y documentación.
2. **Rigidez en Compilación**: Las variables de entorno de Next.js se inyectan en build-time. La única forma de alternar precios en caliente de forma instantánea es leer configuraciones en tiempo real desde la base de datos de Supabase en un Server Action.

### Resolución (The House Way)
1. **Unificación a MundiApp26**: Se sustituyeron todas las menciones del torneo oficial en el código y la PWA para consolidar la marca protegida y legal de la App.
2. **Tabla de Hot-Settings (`app_settings`)**:
   - Se diseñó una tabla centralizada de configuraciones generales en la base de datos de Supabase.
   - Se implementó un **Switch de Pasarela** dinámico en el HQ de administración (God Mode) que altera la clave `founder_pass_test_mode`.
   - **Mecanismo de Resiliencia (Zero Crash)**: El Server Action que crea la preferencia en Mercado Pago consulta esta clave. Si la consulta falla (ej: tabla ausente o error de red), se intercepta el error silenciosamente y aplica el precio oficial final ($50.000 ARS) como fallback por defecto, blindando los cobros de producción de cualquier error lógico.
   - **Censo de Pagos Integrado**: En lugar de placeholders inactivos, se conectó el panel a la API en vivo de Mercado Pago (`/v1/payments/search`) con filtrados de metadatos, cruzando instantáneamente transacciones reales con perfiles de usuarios.

## 2026-05-19: El Callejón sin Salida del Flujo de Registro (Bucle de Redirecciones) (LT-5)

### Síntoma
Un usuario ya registrado en la plataforma (cuya cuenta en Supabase ya fue creada) pero que no llegó a completar el pago de Mercado Pago (o canceló/abandonó el flujo de pago) quedaba atrapado en un bucle infinito ("callejón sin salida") al intentar regresar:
1. Al acceder a `/dashboard`, el middleware y el `DashboardLayout` detectaban que el usuario no pertenecía a ninguna liga (`myLeagues.length === 0`), reescribiéndolo o redirigiéndolo incondicionalmente a la pantalla de registro (`/login?mode=register`).
2. Al ingresar en la pantalla de registro con su cuenta creada, el `LoginShield` detectaba la sesión activa. Si intentaba loguearse con su clave, lo enviaba a `/dashboard`, lo que volvía a disparar la redirección a `/login?mode=register`.
3. Si intentaba registrarse nuevamente con su email, la base de datos arrojaba un error de que el correo ya estaba registrado, imposibilitando por completo continuar.

### Diagnóstico
1. **Falta de Redirección Inteligente por Autenticación**: El middleware y `DashboardLayout` asumían erróneamente que la ausencia de membresía significaba que el usuario era un visitante anónimo que requería registrarse, en lugar de identificar que ya era un usuario logueado con pago pendiente.
2. **URL de Pago Frágil**: La página de `/paywall` requería obligatoriamente recibir el nombre de la liga por query param (`leagueName`). Si el usuario volvía de forma directa al sitio sin ese query string en la URL, el componente arrojaba un alert y lo expulsaba de vuelta al inicio, impidiéndole completar la compra.
3. **Pérdida de Transaccionalidad de Pago Activo**: Si el usuario ya era `founder` en la tabla `profiles` (porque el pago se procesó exitosamente pero la creación de la liga falló o fue cancelada), la aplicación le seguía exigiendo ingresar a Mercado Pago y abonar nuevamente en vez de proveerle una forma directa de fundar su arena.

### Resolución (The House Way)
1. **Redirección de Membresía a Paywall**: Se modificó `src/utils/supabase/middleware.ts` y `src/app/(dashboard)/layout.tsx` para que si un usuario autenticado no posee membresía de liga (y no es `super_admin`), sea redirigido de forma segura a `/paywall` en lugar de a `/login?mode=register`.
2. **Paywall Adaptativo e Inteligente**: Se reescribió `src/app/paywall/page.tsx` para:
   - Consultar el rol del usuario directamente en la fuente de verdad (tabla `profiles` en Supabase) al montarse.
   - Si el usuario **ya pagó (es `founder` o `super_admin`)**, ocultar el botón de cobro y proveer una interfaz premium "Crear mi Arena Gratis" para bautizar su liga e insertarla directamente mediante la Server Action `createLeagueAction`.
   - Si el usuario **no ha pagado**, y el query string `leagueName` está vacío, desplegar un input estético dentro de la card de pago que le permite bautizar su liga antes de proceder al Checkout de Mercado Pago, eliminando la alerta y la obtención de fallos en el flujo.
3. **Landing Dinámica**: Se adaptaron los Server Components de `src/app/page.tsx` para detectar si el usuario posee sesión activa, transformando los botones de "Armá tu Liga" y "Ya estoy Registrado" en accesos directos al Dashboard, HQ o Paywall en caliente de acuerdo a su estado y rol, puliendo el "Customer Journey" al máximo estándar del mercado.

## 2026-05-21: Error de Schema Cache de Supabase en Despliegues Dinámicos (LL-3)

### Síntoma
Al ejecutar el script de sembrado de relaciones corporativas `scratch/seed-corporate.js` contra Supabase, el backend retornaba:
`Could not find the table 'public.corporate_relations' in the schema cache`.

### Diagnóstico
1. **Falta de DDL Inicial en Producción/Desarrollo**: A diferencia de bases de datos tradicionales administradas por ORMs con migraciones automáticas, Supabase no autogenera tablas a partir de consultas `upsert` o `select` de JS/TS si no se ha ejecutado explícitamente el DDL en el SQL Editor o a través del Supabase CLI.
2. **Schema Cache Stale**: Cuando se crea una nueva tabla de manera manual en Supabase, el PostgREST (el motor de API REST) necesita regenerar su cache de esquemas. Las consultas inmediatas hechas mediante el cliente JS (`@supabase/supabase-js`) fallarán hasta que el PostgREST detecte los cambios o se refresque el esquema.

### Resolución (The House Way)
1. **SQL Editor como Único Origen de Verdad DDL**: Todo cambio estructural debe pasar de forma mandatoria por un script `.sql` dentro de `/docs/sql-migrations/`.
2. **Guía de Migración**: Documentar explícitamente al desarrollador o administrador (Yoyo) que ejecute el DDL del archivo `docs/sql-migrations/corporate-branding.sql` en el SQL Editor de Supabase antes de probar la integración de Marca Blanca.
3. **Mecanismo de Resiliencia Visual**: El código de la Server Action `resolveBrandThemeAction()` posee un fallback por diseño que retorna `null` y el tema de MundiApp26 clásico (Oro y Negro) si la tabla no existe o la consulta falla, previniendo que la aplicación entera caiga (Circuit Breaker Visual).

## 2026-05-21: Conflicto de Lock de Auth Token en el Dashboard ("Lock Stolen" por llamadas paralelas)

### Síntoma
Al cargar el Dashboard (`/dashboard`), la aplicación crasheaba aleatoriamente con el error de Next.js:
`Lock "lock:sb-xcrluwxxvyqjyhvbimyn-auth-token" was released because another request stole it`.

### Diagnóstico
La página del Dashboard (`dashboard/page.tsx`) es un componente de cliente que realizaba en paralelo dos llamadas asíncronas al montarse:
1. `supabase.auth.getUser()` en el cliente para obtener la sesión del usuario local.
2. La Server Action `resolveBrandThemeAction()` para resolver el tema de marca de la liga, la cual, internamente en el servidor, también llamaba a `supabase.auth.getUser()`.
Al dispararse ambas peticiones concurrentemente, competían en el mismo milisegundo por leer y actualizar las cookies de sesión y el estado de la autenticación de Supabase (que sincroniza cookies cliente-servidor). Esto provocaba que un proceso "robara" el lock del token al otro, gatillando el error fatal de runtime de Supabase.

### Resolución (The House Way)
**Centralización de Datos a Nivel de Layout y Context Provider Global**. La secuencialización en el `useEffect` ayudaba pero era vulnerable a carreras entre el Server Component (`layout.tsx`) y el Client Component (`page.tsx`) al hidratarse.

La **solución definitiva y robusta** implementada fue:
1. **Evitar Llamar a Server Actions de Autenticación en el Cliente**: Eliminar por completo el llamado a `resolveBrandThemeAction()` dentro de `page.tsx` (Dashboard).
2. **Elevación de Estado en el Layout**: El Server Component de Next.js (`layout.tsx`) resuelve el `brandTheme` de manera segura y atómica en el servidor.
3. **Proveer a través de Contexto de React**: Se inyectó el `brandTheme` en el `SidebarProvider` a nivel global.
4. **Consumo Síncrono e Instantáneo**: Tanto el `Dashboard`, como el `Sidebar` y la barra de navegación móvil consumen la marca síncronamente vía `useSidebar()`.
5. **Migración a `AuthContext` (`useAuth`)**: Se eliminó la inicialización local del cliente de Supabase y las llamadas redundantes a `supabase.auth.getUser()` en `Dashboard`, `Shell` y `MatchesPage`, consumiendo en su lugar la sesión ya establecida en el contexto central de autenticación de la aplicación.
6. **Patrón Singleton en el Cliente de Navegador (`utils/supabase/client.ts`)**: Para blindar de forma absoluta toda la app ante inicializaciones distribuidas de clientes (ej: en el Chat en tiempo real, predicciones y onboarding), se transformó el cliente de navegador en un **Singleton**. Esto garantiza que no importa cuántas veces se invoque `createClient()` en el navegador, siempre retornará la mismísima instancia única global, compartiendo sockets, tokens y listeners, erradicando al 100% cualquier colisión de `navigator.locks` o robo de tokens concurrentes.

Esto elimina de raíz cualquier llamada concurrente a Supabase Auth en el cliente, erradicando el error "Lock stolen" de forma absoluta y acelerando la UI al no requerir viajes de red redundantes.

## 2026-05-23: Rediseño Táctico de Landing (Fusión Bento, Unificación MundiAPP26 y Enfoque Argentino)

### Síntoma
1. **Riesgo Legal de Copyright**: Mención esporádica de "MundialApp2026", la cual incluye términos registrados y protegidos ("Mundial 2026"), generando riesgos de reclamos marcarios.
2. **Pesadez en la Lectura (Fricción en Mobile)**: La landing page contenía una estructura Bento Grid de 4 tarjetas seguida de una sección de "¿Cómo funciona?" de más de 6 tarjetas de texto largo, lo que hacía que el acceso y la comprensión general de la app se sintieran lentos y tediosos.
3. **Poca Presencia de Marca**: El isotipo oficial de la app en la navbar era muy pequeño (48px) y no causaba impacto visual al ingresar mediante códigos QR en eventos locales.

### Diagnóstico
1. **Nombre Oficial**: La app debe llamarse estrictamente **MundiAPP26**. Esto unifica la marca, respeta la propiedad intelectual y simplifica el dominio.
2. **Falta de Síntesis**: El usuario final, especialmente bajo una mentalidad móvil y de uso casual en Argentina, requiere información escaneable en 3 segundos sobre cómo acceder y jugar, sin bloques extensos de texto.
3. **Ubicación Estratégica del Logo**: Alinear la marca como el elemento central del Hero genera mayor confianza y anclaje visual (Endowment Effect) que los banners de características dispersos.

### Resolución (The House Way)
1. **Unificación Absoluta de Marca**: Todo rastro de nombres alternativos fue purgado, unificando la landing page bajo **MundiAPP26**.
2. **Logo Hero Foco**: Se aumentó el logo de la navbar a `w-16 h-16` y se inyectó un gran Isotipo central de `w-28` (móvil) / `w-36` (desktop) sobre el Hero, acompañado de sombras doradas Stadium Gold.
3. **Fusión Bento Minimalista**: Se eliminaron las secciones duplicadas, unificándolas en una sola arena de pronósticos minimalista de 4 tarjetas bento con un toque de degradado dorado radial sutil (`bg-gradient-to-br from-[#0d0d0d] via-[#16130d]/30 to-black`) y un gran Banner horizontal inferior de Fair Play.
4. **Respeto a las Reglas de Negocio**: Se mantuvo y destacó la integración de **API-Football** para certificar la calidad y automatización en tiempo real frente a plantillas o excels tradicionales, consolidando la superioridad tecnológica de la App.
5: **Comportamiento del Código**: Se respetaron al 100% las funciones asíncronas de servidor y los Server Components hidratados para garantizar que el compilador no sufriera advertencias.

## 2026-05-23: Sistema de Códigos Promocionales y Afiliaciones (Resiliencia Onboarding & Anti-N+1)

### Síntoma
1. **Riesgo de Pérdida de Afiliación (Paywall)**: Si el usuario ingresa un código promocional en el Paywall y luego es redirigido a la pasarela externa de Mercado Pago, cualquier caída de red o abandono del webhook provocaría que la referencia del promotor se perdiera, imposibilitando la auditoría de ventas.
2. **Consultas Distribuidas Lentas (N+1)**: El HQ requiere auditar la conversión de cada código promocional. Hacer una consulta separada para contar los referidos y otra para traer los alias y correos de cada código en un bucle iterativo provocaría bloqueos de red y latencias severas en el servidor de analíticas.

### Diagnóstico
1. **Persistencia Síncrona Inmediata**: La afiliación debe registrarse en la tabla de perfiles en el mismo instante en que el usuario valida el código con éxito en el Paywall. Al ser opcional, el registro síncrono blinda la referencia de cualquier interrupción o cancelación de pago posterior.
2. **Agregación Analítica en Memoria (Singleton/Map)**: Para evitar cuellos de botella e ineficiencias de red en consultas multi-usuario del HQ, es obligatorio realizar un **bulk fetch** masivo de todos los perfiles asociados y resolver las relaciones en memoria utilizando un mapa agregador.

### Resolución (The House Way)
1. **Validación y Persistencia Reactiva**: Implementamos una Server Action síncrona (`savePromoCodeToProfileAction`) que actualiza la columna `referred_by_code` en `profiles` inmediatamente después de la validación debounced en caliente.
2. **Bulk Analytic Fetch**: Redactamos la Server Action `getPromoAnalyticsAction` de forma que haga una sola query a `promo_codes` y otra única query de bulk a `profiles`, cruzando y agrupando las relaciones en memoria.
3. **Estética del HQ**: Añadimos el componente modular `PromoControlModule.tsx` con capacidad de copiar códigos con 1 clic al portapapeles e inspectores desplegables dinámicos de gladiadores registrados.
