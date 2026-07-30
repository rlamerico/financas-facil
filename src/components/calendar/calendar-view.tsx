"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import { useTransactions } from "@/hooks/use-transactions";
import {
  buildCalendarGrid,
  type CalendarTransaction,
} from "@/utils/calendar-grid";

interface CalendarViewProps {
  profileId: string;
}

/** Tamanho de página grande o suficiente pra trazer todas as contas
 * pendentes de um mês em uma única página (calendário não usa "carregar
 * mais" — precisa do conjunto completo pra montar o grid). */
const MONTH_PAGE_SIZE = 200;

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

/**
 * Client Component: grid de mês (CSS Grid) com navegação anterior/próximo,
 * mostrando transações com `status = "pending"` agrupadas por dia via
 * `buildCalendarGrid`. Regra de ouro: só `profileId` (string) atravessa a
 * fronteira Server → Client.
 */
export function CalendarView({ profileId }: CalendarViewProps) {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isError } = useTransactions(
    profileId,
    { month, year, status: "pending" },
    MONTH_PAGE_SIZE,
  );

  const transactions: CalendarTransaction[] = useMemo(
    () =>
      (data?.pages ?? []).flat().map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
      })),
    [data],
  );

  const weeks = useMemo(
    () => buildCalendarGrid(month, year, transactions, now),
    [month, year, transactions, now],
  );

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((current) => current - 1);
    } else {
      setMonth((current) => current - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((current) => current + 1);
    } else {
      setMonth((current) => current + 1);
    }
  };

  const monthLabel = MONTH_LABEL.format(new Date(year, month - 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize text-foreground">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Mês anterior"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Próximo mês"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-muted">Carregando calendário...</p>
      )}
      {isError && (
        <p className="mt-4 text-sm text-error">
          Não foi possível carregar as contas do mês.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[640px] rounded-lg border border-border bg-surface shadow-card">
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="p-2 text-center text-xs font-medium text-muted"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {weeks.flat().map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "min-h-[96px] border-b border-r border-border p-2 last:border-r-0",
                    day.isToday && "bg-primary/10",
                    !day.isCurrentMonth && "text-muted/40",
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-medium",
                      day.isCurrentMonth ? "text-foreground" : "text-muted/40",
                      day.isToday && "font-bold text-primary",
                    )}
                  >
                    {day.day}
                  </p>

                  <div className="mt-1 space-y-1">
                    {day.transactions.map((transaction) => (
                      <p
                        key={transaction.id}
                        className={cn(
                          "truncate text-xs tabular-nums",
                          transaction.amount >= 0
                            ? "text-success"
                            : "text-error",
                        )}
                        title={`${transaction.description} — ${formatCurrency(transaction.amount)}`}
                      >
                        {transaction.description} —{" "}
                        {formatCurrency(transaction.amount)}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
