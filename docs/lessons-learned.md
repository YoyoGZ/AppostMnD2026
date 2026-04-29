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
