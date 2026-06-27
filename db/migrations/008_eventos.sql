-- =====================================================================
-- Kubo ERP — Migração 008: menu Eventos
-- Evento tem ID sequencial (EV-000001...) e nome. Cada evento tem itens
-- de Locação e Sublocação, que referenciam Produtos cadastrados.
-- =====================================================================
create table if not exists public.eventos (
  id          uuid primary key default gen_random_uuid(),
  id_evento   text not null,
  seq         integer not null,
  nome        text not null,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.eventos enable row level security;
drop policy if exists "acesso_aberto" on public.eventos;
create policy "acesso_aberto" on public.eventos
  for all to anon, authenticated using (true) with check (true);

create unique index if not exists eventos_idevento_uniq
  on public.eventos (lower(id_evento));
create unique index if not exists eventos_seq_uniq
  on public.eventos (seq);

-- Itens do evento (locacao / sublocacao) -> Produto + quantidade
create table if not exists public.evento_itens (
  id           uuid primary key default gen_random_uuid(),
  evento_id    uuid not null references public.eventos(id) on delete cascade,
  tipo         text not null check (tipo in ('locacao','sublocacao')),
  produto_id   uuid not null references public.produtos(id) on delete restrict,
  quantidade   integer not null default 1,
  created_at   timestamptz not null default now()
);

alter table public.evento_itens enable row level security;
drop policy if exists "acesso_aberto" on public.evento_itens;
create policy "acesso_aberto" on public.evento_itens
  for all to anon, authenticated using (true) with check (true);

create index if not exists idx_evento_itens on public.evento_itens (evento_id);
