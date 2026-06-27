-- =====================================================================
-- Kubo ERP — Migração 010: Cliente no evento
-- O evento passa a referenciar um cliente.
-- =====================================================================
alter table public.eventos
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
