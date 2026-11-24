"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/utils/cn";

export type CardsTab = "resumo" | "lancamentos" | "longo-prazo" | "cartoes";

interface CardsTabDefinition {
  id: CardsTab;
  label: string;
}

/** Ordem das abas na UI (PRD P13). */
export const CARDS_TABS: readonly CardsTabDefinition[] = [
  { id: "resumo", label: "Resumo" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "longo-prazo", label: "Longo prazo" },
  { id: "cartoes", label: "Cartões e regras" },
] as const;

export const DEFAULT_CARDS_TAB: CardsTab = "resumo";

/** Nome do parâmetro de busca que espelha a aba ativa na URL. */
export const CARDS_TAB_PARAM = "aba";

/** Aba inválida ou ausente cai no padrão em vez de quebrar a página. */
export function parseCardsTab(value: string | null | undefined): CardsTab {
  const match = CARDS_TABS.find((tab) => tab.id === value);
  return match ? match.id : DEFAULT_CARDS_TAB;
}

/** Ids estáveis para amarrar `aria-controls` / `aria-labelledby` entre aba e painel. */
export function cardsTabTriggerId(tab: CardsTab): string {
  return `cards-tab-${tab}`;
}

export function cardsTabPanelId(tab: CardsTab): string {
  return `cards-panel-${tab}`;
}

export interface CardsTabsProps {
  activeTab: CardsTab;
  onTabChange: (tab: CardsTab) => void;
}

/**
 * Tablist acessível: roving tabindex (só a aba ativa é focável) e navegação
 * por setas/Home/End, como manda o padrão WAI-ARIA de tabs.
 */
export function CardsTabs({ activeTab, onTabChange }: CardsTabsProps) {
  const triggersRef = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTabAt = (index: number) => {
    const total = CARDS_TABS.length;
    const nextIndex = (index + total) % total;
    const nextTab = CARDS_TABS[nextIndex];
    onTabChange(nextTab.id);
    triggersRef.current[nextIndex]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number | undefined> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: CARDS_TABS.length - 1,
    };

    const target = moves[event.key];
    if (target === undefined) {
      return;
    }

    event.preventDefault();
    focusTabAt(target);
  };

  return (
    <div
      role="tablist"
      aria-label="Seções de faturas de cartão"
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {CARDS_TABS.map((tab, index) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            ref={(node) => {
              triggersRef.current[index] = node;
            }}
            type="button"
            role="tab"
            id={cardsTabTriggerId(tab.id)}
            aria-selected={isActive}
            aria-controls={cardsTabPanelId(tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
