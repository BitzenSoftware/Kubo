-- =====================================================================
-- Kubo ERP — Migração 017: taxa de imposto padrão
-- Marca uma taxa como padrão para o botão "Criar Faturamento".
-- =====================================================================
alter table public.taxa_imposto
  add column if not exists padrao boolean not null default false;
