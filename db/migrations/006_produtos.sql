-- =====================================================================
-- Kubo ERP — Migração 006: menu Produtos
-- Cada produto pertence a uma Categoria. O código é gerado pelo sistema:
-- <codigo_da_categoria> + sequencial de 6 dígitos por categoria (ELT000001).
-- "seq" guarda o número sequencial por categoria (começa em 1).
-- =====================================================================
create table if not exists public.produtos (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references public.categoria(id) on delete restrict,
  codigo        text not null,
  nome          text not null,
  seq           integer not null,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.produtos enable row level security;
drop policy if exists "acesso_aberto" on public.produtos;
create policy "acesso_aberto" on public.produtos
  for all to anon, authenticated using (true) with check (true);

-- Código único (global) e sequencial único por categoria
create unique index if not exists produtos_codigo_uniq
  on public.produtos (lower(codigo));
create unique index if not exists produtos_cat_seq_uniq
  on public.produtos (categoria_id, seq);
create index if not exists idx_produtos_categoria
  on public.produtos (categoria_id);
