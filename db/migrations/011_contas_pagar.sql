-- =====================================================================
-- Kubo ERP — Migração 011: Contas a Pagar + Status de Pagamento
-- =====================================================================
create table if not exists public.conta_pagar_status (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.conta_pagar_status enable row level security;
drop policy if exists "acesso_aberto" on public.conta_pagar_status;
create policy "acesso_aberto" on public.conta_pagar_status
  for all to anon, authenticated using (true) with check (true);
create unique index if not exists conta_pagar_status_nome_uniq
  on public.conta_pagar_status (lower(nome));

create table if not exists public.contas_pagar (
  id                   uuid primary key default gen_random_uuid(),
  data_vencimento      date,
  evento_id            uuid references public.eventos(id) on delete set null,
  plano_contas_id      uuid references public.plano_contas(id) on delete set null,
  empresa_id           uuid references public.empresa(id) on delete set null,
  fornecedor           text,
  descricao            text,
  valor_total          numeric(14,2),
  status_pagamento_id  uuid references public.conta_pagar_status(id) on delete set null,
  data_pagamento       date,
  ativo                boolean not null default true,
  created_at           timestamptz not null default now()
);
alter table public.contas_pagar enable row level security;
drop policy if exists "acesso_aberto" on public.contas_pagar;
create policy "acesso_aberto" on public.contas_pagar
  for all to anon, authenticated using (true) with check (true);
create index if not exists idx_contas_pagar_venc
  on public.contas_pagar (data_vencimento);
