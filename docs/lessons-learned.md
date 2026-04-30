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
1. Estructura de Componente Dinmico: Se refactorizaron las pginas de Onboarding y Login para mover la lgica de parmetros a sub-componentes envueltos en Suspense.
2. Gestin de Plataforma: Desactivar Deployment Protection -> Vercel Authentication en los settings del proyecto en Vercel para permitir acceso pblico a invitados.
