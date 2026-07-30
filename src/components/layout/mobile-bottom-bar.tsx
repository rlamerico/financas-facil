"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import {
  MOBILE_NAV_IDS,
  getNavItemsForRole,
  type NavItem,
  type Role,
} from "./nav-items";

interface MobileBottomBarProps {
  role: Role;
}

/**
 * Navegação inferior mobile com os itens mais usados (PRD §4.4 — "foco em
 * ações rápidas"): Dashboard, Transações, Metas, Relatórios.
 */
export function MobileBottomBar({ role }: MobileBottomBarProps) {
  const pathname = usePathname();
  const items = getNavItemsForRole(role);
  const mobileItems = MOBILE_NAV_IDS.map((id) =>
    items.find((item) => item.id === id),
  ).filter((item): item is NavItem => Boolean(item));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-overlay backdrop-blur lg:hidden print:hidden">
      {mobileItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const disabled = Boolean(item.comingSoon);

        return (
          <Link
            key={item.id}
            href={disabled ? "#" : item.href}
            aria-disabled={disabled}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
              disabled
                ? "pointer-events-none text-muted/50"
                : isActive
                  ? "text-primary"
                  : "text-muted",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-14 items-center justify-center rounded-full transition-colors",
                isActive && "bg-primary/15",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
