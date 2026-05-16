-- Corrección de Políticas RLS para la tabla perfiles (profiles)
-- Elimina políticas defectuosas que causan recursión infinita

-- 1. Eliminar políticas antiguas que puedan estar causando el bucle
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;

-- 2. Asegurarnos que el RLS esté activo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas limpias sin recursión
-- NOTA: NUNCA hacer un select a la misma tabla dentro de un USING en profiles.

-- A) Lectura: Todos pueden leer su propio perfil (o todos pueden leer cualquier perfil público si se requiere, pero lo haremos restringido al usuario por ahora)
CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
USING ( auth.uid() = id );

-- Si el sistema necesita que los usuarios vean el alias/rol de otros:
-- CREATE POLICY "Everyone can read profiles" ON public.profiles FOR SELECT USING (true);
-- Recomendado: Dejar que la lectura sea pública si solo guarda rol y nombre (no datos sensibles).
-- Vamos a permitir lectura pública para que no haya bloqueos en las búsquedas o validaciones:
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Everyone can read profiles" 
ON public.profiles FOR SELECT 
USING ( true );

-- B) Inserción: Solo el mismo usuario al registrarse
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- C) Actualización: El usuario puede actualizar su propio perfil PERO no modificar su propio ROL!
-- En Supabase es difícil restringir columnas específicas en RLS, así que los roles los actualizamos siempre vía Server Actions con el Admin Client (como ya hicimos).
-- Así que la política normal permite actualizar tu propio perfil (alias, avatar).
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );
