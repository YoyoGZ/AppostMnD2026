-- ========================================================================================
-- TABLA: push_subscriptions
-- Propósito: Almacenar los tokens de Web Push generados por los navegadores de los usuarios.
-- ========================================================================================

CREATE TABLE public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Evitar duplicar la misma suscripción del mismo dispositivo
    UNIQUE(user_id, endpoint)
);

-- ========================================================================================
-- RLS (Row Level Security)
-- ========================================================================================
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Users can view their own push subscriptions" 
ON public.push_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias suscripciones (al aceptar notificaciones)
CREATE POLICY "Users can insert their own push subscriptions" 
ON public.push_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden borrar sus suscripciones (al desuscribirse o cerrar sesión)
CREATE POLICY "Users can delete their own push subscriptions" 
ON public.push_subscriptions FOR DELETE 
USING (auth.uid() = user_id);
