-- =====================================================================
-- Kubo ERP — Migração 016: um evento por Faturamento e por Comercial
-- Cada evento só pode estar em um faturamento e em um pedido comercial
-- (mantém Faturamento e Comercial sincronizados pelo evento).
-- Índice parcial: permite vários registros sem evento (evento_id null).
-- Obs: se já houver duplicados de evento, limpe antes de rodar.
-- =====================================================================
create unique index if not exists faturamento_evento_uniq
  on public.faturamento (evento_id) where evento_id is not null;

create unique index if not exists comercial_evento_uniq
  on public.comercial (evento_id) where evento_id is not null;
