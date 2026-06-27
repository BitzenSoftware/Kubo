-- =====================================================================
-- Kubo ERP — Migração 009: Status de evento + Estoque
-- - evento_status: status com comportamento "aloca" (true = aloca estoque,
--   false = libera). O evento referencia um status.
-- - produtos.qtd_atual: quantidade em estoque (que a empresa possui).
-- A Qtd alocada e disponível são calculadas: alocada = soma das LOCAÇÕES
-- de eventos cujo status tem aloca = true.
-- =====================================================================
create table if not exists public.evento_status (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  aloca       boolean not null default false,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.evento_status enable row level security;
drop policy if exists "acesso_aberto" on public.evento_status;
create policy "acesso_aberto" on public.evento_status
  for all to anon, authenticated using (true) with check (true);

create unique index if not exists evento_status_nome_uniq
  on public.evento_status (lower(nome));

-- Evento referencia um status
alter table public.eventos
  add column if not exists status_id uuid references public.evento_status(id) on delete set null;

-- Estoque atual por produto
alter table public.produtos
  add column if not exists qtd_atual integer not null default 0;
