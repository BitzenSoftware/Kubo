-- =====================================================================
-- Kubo ERP — Migração 001: Configurações (cadastros base)
-- Cria as 10 tabelas do menu Configurações.
-- RLS habilitada com política permissiva (acesso via anon key), pois o
-- ERP ainda não tem login. Quando entrar o Supabase Auth, trocamos as
-- políticas por regras por usuário/empresa.
-- =====================================================================

-- Tabelas simples (apenas nome) -----------------------------------------
create table if not exists public.bancos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.formas_pagamento (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.grupo_plano (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.categoria_freelancer (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.tipo_lancamento (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.status_comercial (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.origem_plano_contas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

-- Tabelas com mais colunas ----------------------------------------------
create table if not exists public.freelancers (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cpf         text,
  rg          text,
  nascimento  date,
  created_at  timestamptz not null default now()
);

create table if not exists public.empresa (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cnpj        text,
  created_at  timestamptz not null default now()
);

-- Plano de Contas referencia Grupo do Plano -----------------------------
create table if not exists public.plano_contas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  grupo_id    uuid references public.grupo_plano(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- RLS: habilitar e liberar acesso via anon (sem login por enquanto)
-- =====================================================================
do $$
declare
  t text;
  tabelas text[] := array[
    'bancos','formas_pagamento','grupo_plano','categoria_freelancer',
    'tipo_lancamento','status_comercial','origem_plano_contas',
    'freelancers','empresa','plano_contas'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "acesso_aberto" on public.%I;', t);
    execute format(
      'create policy "acesso_aberto" on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
