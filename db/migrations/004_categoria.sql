-- =====================================================================
-- Kubo ERP — Migração 004: aba "Categoria" das Configurações
-- Prefixo (quantidade de caracteres) + Código (letras, tamanho = prefixo).
-- Código é o identificador (único, case-insensitive).
-- =====================================================================
create table if not exists public.categoria (
  id          uuid primary key default gen_random_uuid(),
  prefixo     integer,
  codigo      text not null,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.categoria enable row level security;
drop policy if exists "acesso_aberto" on public.categoria;
create policy "acesso_aberto" on public.categoria
  for all to anon, authenticated using (true) with check (true);

create unique index if not exists categoria_codigo_uniq
  on public.categoria (lower(codigo));
