-- =====================================================================
-- Kubo ERP — Migração 002: coluna "ativo" nos cadastros das Configurações
-- Adiciona ativo (boolean, default true) em todas as 10 tabelas, para o
-- badge Ativo/Inativo das ações.
-- =====================================================================
do $$
declare
  t text;
  tabelas text[] := array[
    'bancos','formas_pagamento','grupo_plano','categoria_freelancer',
    'tipo_lancamento','status_comercial','origem_plano_contas',
    'freelancers','empresa','plano_contas'
  ];
begin
  foreach t in array tabelas loop
    execute format(
      'alter table public.%I add column if not exists ativo boolean not null default true;',
      t
    );
  end loop;
end $$;
