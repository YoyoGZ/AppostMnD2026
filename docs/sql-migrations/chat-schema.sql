-- =========================================================================
-- MIGRACIÓN: Tabla de Mensajes del Chat de Liga (Realtime)
-- Fecha: 2026-05-15
-- =========================================================================

-- 1. Crear tabla league_messages si no existe
CREATE TABLE IF NOT EXISTS public.league_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_alias text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.league_messages ENABLE ROW LEVEL SECURITY;

-- Política de Lectura: Solo usuarios autenticados
DROP POLICY IF EXISTS "Lectura de mensajes de liga" ON public.league_messages;
CREATE POLICY "Lectura de mensajes de liga" 
  ON public.league_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de Inserción: El usuario debe autenticar su propio ID
DROP POLICY IF EXISTS "Insertar mensaje propio" ON public.league_messages;
CREATE POLICY "Insertar mensaje propio" 
  ON public.league_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Habilitar Supabase Realtime para la tabla
-- Esto es CRÍTICO para que los clientes React escuchen los eventos de INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'league_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.league_messages;
  END IF;
END $$;
