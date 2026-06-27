-- =====================================================================
-- Kubo ERP — Migração 013: menu Faturamento + Status Recebimento + Taxa
-- Tipo de Lançamento reaproveita a tabela tipo_lancamento (movida da UI de
-- Configurações para o menu Faturamento; a tabela permanece a mesma).
-- Campos calculados (Imposto, Líquido, Custo do Evento, Margem) NÃO são
-- armazenados — são derivados na aplicação.
-- =====================================================================
create table if not exists public.status_recebimento (
  id uuid primary key default gen_random_uuid(),
  nome text not null, ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.status_recebimento enable row level security;
drop policy if exists "acesso_aberto" on public.status_recebimento;
create policy "acesso_aberto" on public.status_recebimento for all to anon, authenticated using (true) with check (true);
create unique index if not exists status_recebimento_nome_uniq on public.status_recebimento (lower(nome));

create table if not exists public.taxa_imposto (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  percentual numeric(6,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.taxa_imposto enable row level security;
drop policy if exists "acesso_aberto" on public.taxa_imposto;
create policy "acesso_aberto" on public.taxa_imposto for all to anon, authenticated using (true) with check (true);
create unique index if not exists taxa_imposto_nome_uniq on public.taxa_imposto (lower(nome));

create table if not exists public.faturamento (
  id                     uuid primary key default gen_random_uuid(),
  cliente_id             uuid references public.clientes(id) on delete set null,
  evento_id              uuid references public.eventos(id) on delete set null,
  valor_bruto            numeric(14,2),
  empresa_id             uuid references public.empresa(id) on delete set null,
  taxa_id                uuid references public.taxa_imposto(id) on delete set null,
  nota_fiscal            text,
  data_emissao           date,
  vencimento             date,
  status_recebimento_id  uuid references public.status_recebimento(id) on delete set null,
  data_recebimento       date,
  tipo_id                uuid references public.tipo_lancamento(id) on delete set null,
  ativo                  boolean not null default true,
  created_at             timestamptz not null default now()
);
alter table public.faturamento enable row level security;
drop policy if exists "acesso_aberto" on public.faturamento;
create policy "acesso_aberto" on public.faturamento for all to anon, authenticated using (true) with check (true);
create index if not exists idx_faturamento_evento on public.faturamento (evento_id);
