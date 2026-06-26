import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Settings } from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

/**
 * Configuração central dos menus do ERP.
 * Para adicionar um menu novo: inclua um item aqui e crie a rota
 * correspondente em `src/app/(erp)/<rota>/page.tsx`.
 */
export const menu: MenuGroup[] = [
  {
    label: "Geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
];
