"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { getNavItemsForRole, type Role } from "./nav-items";

interface SidebarProps {
  role: Role;
}

/** Sidebar fixa para desktop (PRD §4.4). */
export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = getNavItemsForRole(role);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col print:hidden">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Image
          src="/logo.png"
          alt="Finanças Fácil"
          width={140}
          height={57}
          className="h-8 w-auto"
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.comingSoon) {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius)] px-3 py-2 text-sm text-muted/60"
                aria-disabled="true"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </span>
                <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  Em breve
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-primary"
                  : "text-muted hover:bg-background hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
