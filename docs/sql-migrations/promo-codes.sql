-- Script de Migración SQL: Códigos Promocionales y Afiliaciones
-- Ejecutar este bloque de código en el SQL Editor de Supabase antes de continuar.

-- 1. Crear tabla promo_codes
create table if not exists public.promo_codes (
    code text primary key,
    owner_name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Modificar tabla profiles para enlazar la referencia
alter table public.profiles 
add column if not exists referred_by_code text references public.promo_codes(code) on delete set null;

-- 3. Habilitar RLS
alter table public.promo_codes enable row level security;

-- 4. Crear políticas RLS seguras
-- Permitir lectura pública para que usuarios anónimos o nuevos puedan validar los códigos en el paywall
create policy "Permitir lectura publica de codigos de promocion" 
on public.promo_codes for select 
using (true);

-- Permitir control total sobre códigos de promoción únicamente a Super Administradores
create policy "Permitir gestion total de codigos a super admins" 
on public.promo_codes for all 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role = 'super_admin'
    )
);

-- 5. Comentario explicativo
comment on table public.promo_codes is 'Almacena los códigos promocionales generados por el administrador para auditoría de afiliación.';
