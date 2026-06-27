-- =====================================================================
-- Kubo ERP — Migração 015: Empresa no Comercial
-- Necessária para o botão "Criar Faturamento" mapear a Empresa.
-- =====================================================================
alter table public.comercial
  add column if not exists empresa_id uuid references public.empresa(id) on delete set null;
