-- =====================================================================
-- Kubo ERP — Migração 012: menu Comercial (Pedidos) + Vendedor + Versão
-- Status Comercial reaproveita a tabela status_comercial (movida da UI de
-- Configurações para o menu Comercial; a tabela permanece a mesma).
-- =====================================================================
create table if not exists public.vendedor (
  id uuid primary key default gen_random_uuid(),
  nome text not null, ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.vendedor enable row level security;
drop policy if exists "acesso_aberto" on public.vendedor;
create policy "acesso_aberto" on public.vendedor for all to anon, authenticated using (true) with check (true);
create unique index if not exists vendedor_nome_uniq on public.vendedor (lower(nome));

create table if not exists public.versao (
  id uuid primary key default gen_random_uuid(),
  nome text not null, ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.versao enable row level security;
drop policy if exists "acesso_aberto" on public.versao;
create policy "acesso_aberto" on public.versao for all to anon, authenticated using (true) with check (true);
create unique index if not exists versao_nome_uniq on public.versao (lower(nome));

create table if not exists public.comercial (
  id                   uuid primary key default gen_random_uuid(),
  data_pedido          date,
  status_comercial_id  uuid references public.status_comercial(id) on delete set null,
  cliente_id           uuid references public.clientes(id) on delete set null,
  evento_id            uuid references public.eventos(id) on delete set null,
  agencia              text,
  responsavel          text,
  local                text,
  data_evento_inicio   date,
  data_evento_fim      date,
  vendedor_id          uuid references public.vendedor(id) on delete set null,
  valor_orcado         numeric(14,2),
  versao_id            uuid references public.versao(id) on delete set null,
  ativo                boolean not null default true,
  created_at           timestamptz not null default now()
);
alter table public.comercial enable row level security;
drop policy if exists "acesso_aberto" on public.comercial;
create policy "acesso_aberto" on public.comercial for all to anon, authenticated using (true) with check (true);
create index if not exists idx_comercial_data on public.comercial (data_pedido);
