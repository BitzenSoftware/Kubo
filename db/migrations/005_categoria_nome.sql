-- =====================================================================
-- Kubo ERP — Migração 005: campo "nome" na aba Categoria
-- Adiciona a coluna nome em public.categoria (Código continua sendo a
-- chave única).
-- =====================================================================
alter table public.categoria add column if not exists nome text;
