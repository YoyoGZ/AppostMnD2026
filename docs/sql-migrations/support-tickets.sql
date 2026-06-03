-- Script de Migración SQL: Tickets de Soporte Técnico y Contacto
-- Ejecutar este bloque de código en el SQL Editor de Supabase antes de continuar.

-- 1. Crear tabla support_tickets
create table if not exists public.support_tickets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete set null,
    email text not null,
    alias text not null,
    message text not null,
    status text default 'open'::text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar RLS
alter table public.support_tickets enable row level security;

-- 3. Crear políticas RLS seguras

-- Permitir a cualquier usuario (incluso anónimos o deslogueados) enviar consultas de soporte
create policy "Permitir creacion publica de tickets de soporte"
on public.support_tickets for insert
with check (true);

-- Permitir lectura y gestión de tickets únicamente a Super Administradores
create policy "Permitir lectura y gestion de tickets a super admins"
on public.support_tickets for all
using (
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'super_admin'
    )
);

-- 4. Comentario explicativo
comment on table public.support_tickets is 'Almacena los tickets de soporte enviados por los usuarios en el formulario de contacto.';
