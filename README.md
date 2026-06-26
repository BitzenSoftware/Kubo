# Kubo ERP

ERP web — by Bitzen Software.

Stack: **Next.js (App Router) + TypeScript + Tailwind CSS**. Banco de dados (Supabase/Postgres) será integrado em fase posterior.

## Desenvolvimento

```bash
npm install
npm run dev
```

App em http://localhost:3000

## Estrutura

```
src/
  app/
    (erp)/              # área autenticada do ERP (layout com sidebar)
      layout.tsx        # shell: sidebar de menus + topbar
      dashboard/        # página inicial do ERP
      ...               # cada menu vira uma rota aqui
  components/           # componentes reutilizáveis (sidebar, ui, ...)
  lib/                  # helpers, configuração de menus
```

## Licença

Proprietário © Bitzen Software. Todos os direitos reservados.
