-- =====================================================================
-- Kubo ERP — Migração 007: menu Clientes
-- Cadastro simples de clientes (Nome, CNPJ).
-- =====================================================================
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cnpj        text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.clientes enable row level security;
drop policy if exists "acesso_aberto" on public.clientes;
create policy "acesso_aberto" on public.clientes
  for all to anon, authenticated using (true) with check (true);
