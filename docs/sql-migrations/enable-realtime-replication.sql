-- Habilitar replicación de realtime en Supabase para las tablas críticas
-- Ejecutar estas sentencias en el SQL Editor del panel de Supabase para activar la transmisión en tiempo real de marcadores, estados y goles.

-- 1. Habilitar realtime para la tabla match_results (marcadores, elapsed, status)
alter publication supabase_realtime add table match_results;

-- 2. Habilitar realtime para la tabla app_settings (lista de goles, gol reciente)
alter publication supabase_realtime add table app_settings;
