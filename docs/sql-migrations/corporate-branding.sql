-- =========================================================================
-- MUNDIAPP26 - MIGRACIÓN: MARCA BLANCA CORPORATIVA (CO-BRANDING)
-- Instrucciones: Ejecuta este código en el SQL Editor de tu proyecto en Supabase.
-- =========================================================================

-- 1. Crear la tabla de relaciones corporativas
CREATE TABLE IF NOT EXISTS public.corporate_relations (
  email text PRIMARY KEY,                       -- El email del Founder corporativo
  brand_id text NOT NULL,                       -- ID del patrocinador (ej: 'globant')
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.corporate_relations ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de seguridad RLS

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS "Lectura pública de relaciones corporativas" ON public.corporate_relations;
DROP POLICY IF EXISTS "Modificación exclusiva de super admins" ON public.corporate_relations;

-- Lectura pública para cualquier usuario autenticado de la aplicación
CREATE POLICY "Lectura pública de relaciones corporativas" 
  ON public.corporate_relations FOR SELECT 
  USING (true);

-- Escritura completa (Insert, Update, Delete) restringida exclusivamente al super_admin
CREATE POLICY "Modificación exclusiva de super admins" 
  ON public.corporate_relations FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- 4. Inyectar correos de prueba por defecto (para testear localmente y producción)
INSERT INTO public.corporate_relations (email, brand_id)
VALUES 
  ('test.founder@globant.com', 'globant'),
  ('test@globant.com', 'globant')
ON CONFLICT (email) DO NOTHING;
