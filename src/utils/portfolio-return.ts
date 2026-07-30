export interface InvestmentForReturn {
  id: string;
  assetName: string;
  quantity: number;
  averagePrice: number;
  /** `null` = ainda sem cotação atual informada (preço é editável manualmente). */
  currentPrice: number | null;
}

export interface PortfolioReturnRow {
  id: string;
  assetName: string;
  /** Custo total investido (`quantity * averagePrice`). */
  investedValue: number;
  /**
   * Valor de mercado atual (`quantity * currentPrice`). `null` quando o
   * ativo ainda não tem `currentPrice` informado — nesse caso o ativo não
   * entra no valor total consolidado (ver `totalCurrentValue`), pra não
   * subestimar a carteira tratando "sem cotação" como zero.
   */
  currentValue: number | null;
  /** `currentValue - investedValue`. `null` quando `currentValue` é `null`. */
  gain: number | null;
  /** `(currentPrice - averagePrice) / averagePrice * 100`. `null` quando sem cotação. */
  returnPercentage: number | null;
}

export interface PortfolioReturnSummary {
  rows: PortfolioReturnRow[];
  /** Soma do custo investido de todos os ativos. */
  totalInvestedValue: number;
  /**
   * Soma do valor de mercado só dos ativos com `currentPrice` informado.
   * Ativos sem cotação são excluídos (não como zero) — ver `currentValue`.
   */
  totalCurrentValue: number;
  /** `totalCurrentValue - totalInvestedValue` (considerando só ativos com cotação). */
  totalGain: number;
  /** `totalGain / totalInvestedValue-com-cotação * 100`. `null` sem nenhum ativo cotado. */
  totalReturnPercentage: number | null;
}

/**
 * Calcula a carteira consolidada de investimentos: valor total investido,
 * valor de mercado atual e rentabilidade (%) por ativo e agregada.
 *
 * `current_price` nulo é tratado como "sem cotação ainda" (o usuário não
 * preencheu o preço atual manualmente) — não é o mesmo que cotação zero, e
 * por isso o ativo fica de fora dos totais de valor de mercado/rentabilidade
 * até que um preço atual seja informado, para não distorcer os números da
 * carteira.
 */
export function calculatePortfolioReturn(
  investments: InvestmentForReturn[],
): PortfolioReturnSummary {
  const rows = investments.map((investment) => {
    const investedValue = investment.quantity * investment.averagePrice;
    const hasCurrentPrice = investment.currentPrice !== null;

    const currentValue = hasCurrentPrice
      ? investment.quantity * (investment.currentPrice as number)
      : null;

    const gain = hasCurrentPrice ? (currentValue as number) - investedValue : null;

    const returnPercentage = hasCurrentPrice
      ? (((investment.currentPrice as number) - investment.averagePrice) /
          investment.averagePrice) *
        100
      : null;

    return {
      id: investment.id,
      assetName: investment.assetName,
      investedValue,
      currentValue,
      gain,
      returnPercentage,
    };
  });

  const totalInvestedValue = rows.reduce((sum, row) => sum + row.investedValue, 0);

  const quotedRows = rows.filter((row) => row.currentValue !== null);
  const totalCurrentValue = quotedRows.reduce(
    (sum, row) => sum + (row.currentValue as number),
    0,
  );
  const totalInvestedValueQuoted = quotedRows.reduce(
    (sum, row) => sum + row.investedValue,
    0,
  );
  const totalGain = totalCurrentValue - totalInvestedValueQuoted;
  const totalReturnPercentage =
    quotedRows.length > 0 && totalInvestedValueQuoted > 0
      ? (totalGain / totalInvestedValueQuoted) * 100
      : null;

  return {
    rows,
    totalInvestedValue,
    totalCurrentValue,
    totalGain,
    totalReturnPercentage,
  };
}
