-- =====================================================================
-- Kubo ERP — Migração 018: Agências (Comercial)
-- Agência passa a ser um cadastro; o pedido comercial referencia a agência.
-- =====================================================================
create table if not exists public.agencia (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.agencia enable row level security;
drop policy if exists "acesso_aberto" on public.agencia;
create policy "acesso_aberto" on public.agencia
  for all to anon, authenticated using (true) with check (true);
create unique index if not exists agencia_nome_uniq on public.agencia (lower(nome));

alter table public.comercial
  add column if not exists agencia_id uuid references public.agencia(id) on delete set null;
