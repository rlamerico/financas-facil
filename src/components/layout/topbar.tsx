"use client";

import { DropdownMenu } from "radix-ui";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut } from "@/app/(app)/actions";
import { getInitials } from "@/utils/initials";
import { cn } from "@/utils/cn";
import { ThemeToggle } from "./theme-toggle";
import type { Role } from "./nav-items";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  user: "Usuário",
  viewer: "Visualizador",
};

interface TopbarProps {
  fullName: string | null;
  role: Role;
}

/** Topbar com identidade do usuário, badge de role e logout. */
export function Topbar({ fullName, role }: TopbarProps) {
  const displayName = fullName?.trim() || "Sem nome";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur lg:px-6 print:hidden">
      <div className="lg:hidden">
        <span className="text-sm font-semibold text-primary">
          Finanças Fácil
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <span
          className={cn(
            "hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block",
            role === "admin"
              ? "bg-secondary/10 text-secondary"
              : "bg-background text-muted",
          )}
        >
          {ROLE_LABELS[role]}
        </span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-sm font-medium text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-800 text-xs font-bold text-white shadow-card"
                aria-hidden
              >
                {getInitials(fullName)}
              </span>
              <span className="hidden sm:inline">{displayName}</span>
              <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[180px] rounded-lg border border-border bg-surface p-1 shadow-overlay animate-fade-in"
            >
              <DropdownMenu.Item asChild>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-[calc(var(--radius)-0.25rem)] px-2.5 py-2 text-sm text-error hover:bg-error/10 focus-visible:outline-none"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Sair
                  </button>
                </form>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
