"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CARDS_TAB_PARAM,
  CARDS_TABS,
  CardsTabs,
  cardsTabPanelId,
  cardsTabTriggerId,
  parseCardsTab,
  type CardsTab,
} from "./cards-tabs";
import { CreditCardsSection } from "./credit-cards-section";
import { ExclusionRulesSection } from "./exclusion-rules-section";
import { EmptyState } from "./empty-state";

export interface CardsViewProps {
  profileId: string;
}

/** Abas ainda sem conteúdo real. "Cartões e regras" saiu daqui nas specs 004/005. */
const TAB_PLACEHOLDERS: Partial<
  Record<CardsTab, { title: string; description: string }>
> = {
  resumo: {
    title: "Resumo em construção",
    description:
      "Aqui vai aparecer quanto cada cartão gastou no mês selecionado, com o total consolidado.",
  },
  lancamentos: {
    title: "Lançamentos em construção",
    description:
      "Aqui vai aparecer a lista completa dos itens da fatura, com filtros e busca.",
  },
  "longo-prazo": {
    title: "Longo prazo em construção",
    description:
      "Aqui vai aparecer a evolução do gasto de todos os cartões ao longo dos meses.",
  },
};

/**
 * Shell do módulo P13: só orquestra as abas. "Cartões e regras" já tem
 * conteúdo real (cadastro na spec 004, regras de exclusão na 005); as outras
 * três ganham o seu nas specs 007–009.
 *
 * A aba ativa vive em `useState`, semeado pela URL, e cada troca espelha o
 * valor de volta na query com `router.replace` — assim a aba sobrevive ao
 * refresh e pode ser linkada, sem que o clique fique esperando o round-trip do
 * router para pintar a aba nova.
 */
export function CardsView({ profileId }: CardsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<CardsTab>(() =>
    parseCardsTab(searchParams.get(CARDS_TAB_PARAM)),
  );

  const handleTabChange = (tab: CardsTab) => {
    setActiveTab(tab);

    const params = new URLSearchParams(searchParams.toString());
    params.set(CARDS_TAB_PARAM, tab);
    router.replace(`/cartoes?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <CardsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {CARDS_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const placeholder = TAB_PLACEHOLDERS[tab.id];

        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={cardsTabPanelId(tab.id)}
            aria-labelledby={cardsTabTriggerId(tab.id)}
            hidden={!isActive}
            tabIndex={0}
            className="mt-6 focus-visible:outline-none"
          >
            {isActive && tab.id === "cartoes" && (
              <div className="space-y-10">
                <CreditCardsSection profileId={profileId} />
                <ExclusionRulesSection profileId={profileId} />
              </div>
            )}
            {isActive && placeholder && (
              <EmptyState
                title={placeholder.title}
                description={placeholder.description}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
