-- Script de Migración SQL: Soporte de Múltiples Ligas (Multi-Liga)
-- Ejecutar este bloque de código en el SQL Editor de Supabase antes de continuar.

-- 1. Agregar columna para trackear cuántas ligas puede fundar el usuario (Pases comprados/habilitados)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS max_leagues INTEGER DEFAULT 0;

-- 2. Inicializar slots para los usuarios existentes
-- Los usuarios que ya son founders o super_admins reciben 1 slot habilitado por defecto
UPDATE public.profiles 
SET max_leagues = 1 
WHERE role = 'founder' OR role = 'super_admin';

-- Los miembros normales tienen 0 slots por defecto (deben pasar por paywall)
UPDATE public.profiles 
SET max_leagues = 0 
WHERE role = 'member' AND max_leagues IS NULL;

-- 3. Comentario explicativo
COMMENT ON COLUMN public.profiles.max_leagues IS 'Límite máximo de ligas privadas que este usuario está habilitado a fundar (Capitán).';
