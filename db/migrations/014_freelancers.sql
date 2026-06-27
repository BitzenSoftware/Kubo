-- =====================================================================
-- Kubo ERP — Migração 014: menu Freelancers (serviços)
-- - categoria_freelancer ganha grupo_id (Nome + Grupo, igual Plano de Contas)
-- - freelancer_servico: lançamentos de serviços de freelancers por evento
-- =====================================================================
alter table public.categoria_freelancer
  add column if not exists grupo_id uuid references public.grupo_plano(id) on delete set null;

create table if not exists public.freelancer_servico (
  id                    uuid primary key default gen_random_uuid(),
  cliente_id            uuid references public.clientes(id) on delete set null,
  evento_id             uuid references public.eventos(id) on delete set null,
  freelancer_id         uuid references public.freelancers(id) on delete set null,
  descricao_servico     text,
  data_evento_inicio    date,
  data_evento_fim       date,
  valor                 numeric(14,2),
  data_vencimento       date,
  categoria_id          uuid references public.categoria_freelancer(id) on delete set null,
  status_pagamento_id   uuid references public.status_recebimento(id) on delete set null,
  data_pagamento        date,
  ativo                 boolean not null default true,
  created_at            timestamptz not null default now()
);
alter table public.freelancer_servico enable row level security;
drop policy if exists "acesso_aberto" on public.freelancer_servico;
create policy "acesso_aberto" on public.freelancer_servico
  for all to anon, authenticated using (true) with check (true);
create index if not exists idx_freelancer_servico_evento on public.freelancer_servico (evento_id);
