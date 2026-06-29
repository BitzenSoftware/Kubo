-- =====================================================================
-- Kubo ERP — Migração 019: Usuários (Supabase Auth + perfil + RBAC)
-- Perfil ligado ao auth.users. Login por nome (mapeado para um e-mail
-- interno deterministico no app). Escritas só pela service role (server).
-- =====================================================================
create table if not exists public.usuarios (
  id                    uuid primary key references auth.users(id) on delete cascade,
  nome                  text not null,
  email                 text not null,
  is_admin              boolean not null default false,
  must_change_password  boolean not null default true,
  permissoes            text[] not null default '{}',
  ativo                 boolean not null default true,
  created_at            timestamptz not null default now()
);
create unique index if not exists usuarios_nome_uniq on public.usuarios (lower(nome));

alter table public.usuarios enable row level security;

-- is_admin() — SECURITY DEFINER evita recursão na policy
create or replace function public.is_admin()
  returns boolean language sql security definer stable
  set search_path = public as $$
  select coalesce((select is_admin from public.usuarios where id = auth.uid()), false);
$$;

-- Cada um lê o próprio perfil; admin lê todos. Escritas só via service role.
drop policy if exists "ler_proprio_ou_admin" on public.usuarios;
create policy "ler_proprio_ou_admin" on public.usuarios
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- O próprio usuário marca que já trocou a senha (sem poder mudar outros campos)
create or replace function public.marcar_senha_alterada()
  returns void language sql security definer
  set search_path = public as $$
  update public.usuarios set must_change_password = false where id = auth.uid();
$$;
