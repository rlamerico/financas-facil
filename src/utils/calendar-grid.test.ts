import { describe, expect, test } from "vitest";
import { buildCalendarGrid, type CalendarTransaction } from "./calendar-grid";

describe("buildCalendarGrid", () => {
  test("junho/2026: começa domingo 31/05 e termina sábado 04/07, em 5 semanas de 7 dias", () => {
    const weeks = buildCalendarGrid(6, 2026, []);

    expect(weeks).toHaveLength(5);
    weeks.forEach((week) => expect(week).toHaveLength(7));

    const firstDay = weeks[0][0];
    expect(firstDay.date).toBe("2026-05-31");
    expect(firstDay.isCurrentMonth).toBe(false);

    const lastWeek = weeks[weeks.length - 1];
    const lastDay = lastWeek[lastWeek.length - 1];
    expect(lastDay.date).toBe("2026-07-04");
    expect(lastDay.isCurrentMonth).toBe(false);

    // 01/06/2026 é o primeiro dia do mês corrente no grid.
    const flat = weeks.flat();
    const firstOfMonth = flat.find((day) => day.date === "2026-06-01");
    expect(firstOfMonth?.isCurrentMonth).toBe(true);
    expect(firstOfMonth?.day).toBe(1);

    const lastOfMonth = flat.find((day) => day.date === "2026-06-30");
    expect(lastOfMonth?.isCurrentMonth).toBe(true);
  });

  test("marca isToday só para a data de referência passada, dias de outros meses nunca são hoje", () => {
    const weeks = buildCalendarGrid(6, 2026, [], new Date(2026, 5, 15));
    const flat = weeks.flat();

    const today = flat.find((day) => day.isToday);
    expect(today?.date).toBe("2026-06-15");
    expect(flat.filter((day) => day.isToday)).toHaveLength(1);
  });

  test("agrupa transações do mês corrente no dia certo, inclusive múltiplas no mesmo dia", () => {
    const transactions: CalendarTransaction[] = [
      { id: "1", description: "Aluguel", amount: -1500, date: "2026-06-05" },
      { id: "2", description: "Condomínio", amount: -400, date: "2026-06-05" },
      { id: "3", description: "Salário", amount: 5000, date: "2026-06-20" },
    ];

    const weeks = buildCalendarGrid(6, 2026, transactions);
    const flat = weeks.flat();

    const day5 = flat.find((day) => day.date === "2026-06-05");
    expect(day5?.transactions).toHaveLength(2);
    expect(day5?.transactions.map((t) => t.id).sort()).toEqual(["1", "2"]);

    const day20 = flat.find((day) => day.date === "2026-06-20");
    expect(day20?.transactions).toEqual([transactions[2]]);

    const day10 = flat.find((day) => day.date === "2026-06-10");
    expect(day10?.transactions).toEqual([]);
  });

  test("ignora transações caídas nos dias de preenchimento do mês anterior/seguinte", () => {
    const transactions: CalendarTransaction[] = [
      { id: "1", description: "Fora do mês", amount: -50, date: "2026-05-31" },
      { id: "2", description: "Também fora", amount: -50, date: "2026-07-01" },
    ];

    const weeks = buildCalendarGrid(6, 2026, transactions);
    const flat = weeks.flat();

    const may31 = flat.find((day) => day.date === "2026-05-31");
    const jul01 = flat.find((day) => day.date === "2026-07-01");
    expect(may31?.transactions).toEqual([]);
    expect(jul01?.transactions).toEqual([]);
  });

  test("aceita timestamps completos no campo date, usando só os 10 primeiros caracteres", () => {
    const transactions: CalendarTransaction[] = [
      {
        id: "1",
        description: "Com timestamp",
        amount: -20,
        date: "2026-06-12T00:00:00.000Z",
      },
    ];

    const weeks = buildCalendarGrid(6, 2026, transactions);
    const day12 = weeks.flat().find((day) => day.date === "2026-06-12");
    expect(day12?.transactions).toHaveLength(1);
  });

  test("fevereiro/2028 (ano bissexto) tem 29 dias e o grid fecha em múltiplo de 7", () => {
    const weeks = buildCalendarGrid(2, 2028, []);
    const flat = weeks.flat();

    expect(flat.length % 7).toBe(0);
    const currentMonthDays = flat.filter((day) => day.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(29);
  });

  test("dezembro/2025 atravessa a virada de ano no preenchimento final", () => {
    const weeks = buildCalendarGrid(12, 2025, []);
    const flat = weeks.flat();

    const lastDay = flat[flat.length - 1];
    // Deve conter algum dia de janeiro/2026 no preenchimento, se necessário.
    const hasNextYearPadding = flat.some(
      (day) => day.date.startsWith("2026-01") && !day.isCurrentMonth,
    );
    expect(lastDay.isCurrentMonth || hasNextYearPadding).toBe(true);
  });
});
