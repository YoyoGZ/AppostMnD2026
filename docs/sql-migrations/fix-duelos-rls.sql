-- =========================================================================
-- MIGRACIÓN: Fix RLS de Tablas de Duelos + Columna duelos_ganados
-- Fecha: 2026-05-04
-- Referencia: Problems.md #5 / lessons-learned.md LT-2
--
-- INSTRUCCIONES: Pega este script en el SQL Editor de Supabase y ejecuta RUN.
-- Es IDEMPOTENTE — se puede ejecutar varias veces sin romper nada.
-- =========================================================================

-- ─── PASO 1: Agregar la columna duelos_ganados si no existe ───────────────
-- (Fue agregada después del schema inicial, puede no existir en todos los entornos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'league_members' AND column_name = 'duelos_ganados'
  ) THEN
    ALTER TABLE public.league_members ADD COLUMN duelos_ganados integer DEFAULT 0;
  END IF;
END $$;

-- ─── PASO 2: Habilitar RLS en las tablas de Duelos (por si no estaba) ─────
ALTER TABLE public.league_duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_participants ENABLE ROW LEVEL SECURITY;

-- ─── PASO 3: Políticas para league_duels ──────────────────────────────────

-- Lectura: cualquier usuario autenticado puede ver los duelos de su liga
-- (misma política permisiva que leagues y league_members)
DROP POLICY IF EXISTS "Lectura general de duelos" ON public.league_duels;
CREATE POLICY "Lectura general de duelos"
  ON public.league_duels
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Inserción: solo usuarios autenticados pueden crear duelos
DROP POLICY IF EXISTS "Insertar duelo autenticado" ON public.league_duels;
CREATE POLICY "Insertar duelo autenticado"
  ON public.league_duels
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Actualización: el Oráculo (cualquier autenticado) puede resolver duelos
-- Solo puede cambiar el status (no el created_by ni league_id)
DROP POLICY IF EXISTS "Actualizar estado de duelo" ON public.league_duels;
CREATE POLICY "Actualizar estado de duelo"
  ON public.league_duels
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ─── PASO 4: Políticas para duel_participants ─────────────────────────────

-- CRÍTICO: Lectura permisiva para TODOS los autenticados.
-- Esto es necesario para que el Oráculo pueda hacer el bulk fetch
-- de victorias de todos los gladiadores sin ser bloqueado por RLS.
-- Los datos de duel_participants NO son sensibles (solo win/loss).
DROP POLICY IF EXISTS "Lectura de participantes de duelo" ON public.duel_participants;
CREATE POLICY "Lectura de participantes de duelo"
  ON public.duel_participants
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Inserción: el Capitán puede agregar participantes al crear el duelo
DROP POLICY IF EXISTS "Insertar participante de duelo" ON public.duel_participants;
CREATE POLICY "Insertar participante de duelo"
  ON public.duel_participants
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Actualización: el Oráculo puede marcar ganadores (is_winner = true)
DROP POLICY IF EXISTS "Oráculo puede marcar ganadores" ON public.duel_participants;
CREATE POLICY "Oráculo puede marcar ganadores"
  ON public.duel_participants
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ─── PASO 5: Política de UPDATE para league_members (duelos_ganados) ──────
-- Verifica que el Oráculo puede actualizar duelos_ganados en league_members
-- (Esta política puede ya existir del schema original, DROP IF EXISTS es seguro)
DROP POLICY IF EXISTS "Oráculo puede actualizar stats de miembros" ON public.league_members;
CREATE POLICY "Oráculo puede actualizar stats de miembros"
  ON public.league_members
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- =========================================================================
-- FIN DE MIGRACIÓN
-- Verificación: después de ejecutar, el Oráculo debería poder
-- actualizar duelos_ganados para TODOS los miembros de la liga.
-- =========================================================================
