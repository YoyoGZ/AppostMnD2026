-- =========================================================================
-- MUNDIAL 2026 - SCHEMA INICIAL (TORNEO DE APUESTAS)
-- Instrucciones: Pega este código en el SQL Editor de tu proyecto en Supabase y dale "RUN"
-- =========================================================================

-- 1. Tabla de Ligas Privadas
CREATE TABLE public.leagues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Participantes (Miembros de la Liga)
CREATE TABLE public.league_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  alias text NOT NULL,
  
  -- Campos para la "Arena de Gladiadores" (Leaderboard)
  total_pts integer DEFAULT 0,
  aciertos_simples integer DEFAULT 0,
  plenos_exactos integer DEFAULT 0,
  racha text[] DEFAULT '{}'::text[], -- Ej: ['W', 'L', 'W']
  
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(league_id, user_id) -- Un usuario solo puede estar 1 vez por liga
);

-- 3. Tabla de Predicciones (Los Boletos de Apuesta)
CREATE TABLE public.predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id integer NOT NULL, -- ID del partido que viene del JSON
  
  equipo_a_goles integer NOT NULL,
  equipo_b_goles integer NOT NULL,
  
  is_locked boolean DEFAULT false, -- Candado de "Blind Reveal"
  points_earned integer DEFAULT null, -- Nulo hasta que el motor lo calcule
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, match_id) -- Solo un boleto por partido por persona
);

-- =========================================================================
-- SEGURIDAD: Row Level Security (RLS)
-- =========================================================================
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura (Todos los logueados pueden ver datos)
CREATE POLICY "Lectura general de ligas" ON public.leagues FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Lectura de miembros" ON public.league_members FOR SELECT USING (auth.role() = 'authenticated');

-- Política Blind Reveal para Predicciones:
-- Puedes ver TUS predicciones siempre. 
-- Las de OTROS solo las ves si el partido está bloqueado (is_locked = true).
CREATE POLICY "Blind Reveal Read" ON public.predictions
FOR SELECT USING (
  auth.uid() = user_id OR is_locked = true
);

-- Inserción de apuestas (Solo tú insertas las tuyas)
CREATE POLICY "Insertar mis propios boletos" ON public.predictions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Actualización (Solo si NO está locked)
CREATE POLICY "Editar mis boletos abiertos" ON public.predictions
FOR UPDATE USING (
  auth.uid() = user_id AND is_locked = false
);
