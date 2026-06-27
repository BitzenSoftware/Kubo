import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CalendarDays,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

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
    label: "Cadastros",
    items: [
      { label: "Clientes", href: "/clientes", icon: Users },
      { label: "Produtos", href: "/produtos", icon: Package },
    ],
  },
  {
    label: "Operação",
    items: [
      { label: "Eventos", href: "/eventos", icon: CalendarDays },
      { label: "Estoque", href: "/estoque", icon: Boxes },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Contas a Pagar", href: "/contas-pagar", icon: Wallet },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
];
