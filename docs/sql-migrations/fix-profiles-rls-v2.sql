DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 2. Asegurarnos que el RLS esté activo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crear política limpia sin recursión para lectura
CREATE POLICY "Everyone can read profiles" 
ON public.profiles FOR SELECT 
USING ( true );

-- 4. Inserción: Solo el mismo usuario al registrarse
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- 5. Actualización: El usuario puede actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );
