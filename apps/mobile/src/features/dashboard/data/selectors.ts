import { formatCurrencyFromCents } from "@banking/shared/domain";

import type {
  DashboardCategoryData,
  DashboardCategoryViewModel,
  DashboardIndicatorsViewModel,
  DashboardMonthlyData,
  DashboardMonthlyViewModel,
  DashboardPeriod,
  DashboardSummaryData,
} from "../types";

const CATEGORY_COLORS = ["#0E7F84", "#2563EB", "#0F8A5F", "#B45309", "#64748B"];

function calendarDate(year: number, monthIndex: number, day: number): string {
  return [
    year.toString().padStart(4, "0"),
    (monthIndex + 1).toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
}

function monthRange(date: Date) {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const key = `${year}-${(monthIndex + 1).toString().padStart(2, "0")}`;

  return {
    key,
    startDate: calendarDate(year, monthIndex, 1),
    endDate: calendarDate(year, monthIndex, lastDay),
    shortLabel: new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(date)
      .replace(".", ""),
    longLabel: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(date),
  };
}

export function createDashboardPeriod(now = new Date()): DashboardPeriod {
  const current = monthRange(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previous = monthRange(previousDate);
  const months = Array.from({ length: 6 }, (_, index) =>
    monthRange(new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)),
  );

  return {
    key: current.key,
    label: current.longLabel.replace(/^./, (character) => character.toUpperCase()),
    startDate: current.startDate,
    endDate: current.endDate,
    previous: { startDate: previous.startDate, endDate: previous.endDate },
    months,
  };
}

function comparison(
  current: number,
  previous: number,
  positiveWhenHigher: boolean,
): Pick<DashboardIndicatorsViewModel["balance"], "comparisonText" | "comparisonTone"> {
  if (current === previous) {
    return { comparisonText: "Sem alteração em relação ao mês anterior", comparisonTone: "neutral" };
  }
  if (previous === 0) {
    return { comparisonText: "Sem base de comparação no mês anterior", comparisonTone: "neutral" };
  }

  const percentage = Math.abs(((current - previous) / Math.abs(previous)) * 100);
  const increased = current > previous;
  const favorable = positiveWhenHigher ? increased : !increased;
  return {
    comparisonText: `${percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% ${
      increased ? "acima" : "abaixo"
    } do mês anterior`,
    comparisonTone: favorable ? "positive" : "negative",
  };
}

export function selectDashboardIndicators(
  summary: DashboardSummaryData,
): DashboardIndicatorsViewModel {
  const currentNet = summary.current.incomeInCents - summary.current.expenseInCents;
  const previousNet = summary.previous.incomeInCents - summary.previous.expenseInCents;

  return {
    balance: {
      label: "Saldo",
      valueInCents: summary.balanceInCents,
      formattedValue: formatCurrencyFromCents(summary.balanceInCents),
      ...comparison(currentNet, previousNet, true),
    },
    totalIncome: {
      label: "Entradas",
      valueInCents: summary.current.incomeInCents,
      formattedValue: formatCurrencyFromCents(summary.current.incomeInCents),
      ...comparison(summary.current.incomeInCents, summary.previous.incomeInCents, true),
    },
    totalExpense: {
      label: "Saídas",
      valueInCents: summary.current.expenseInCents,
      formattedValue: formatCurrencyFromCents(summary.current.expenseInCents),
      ...comparison(summary.current.expenseInCents, summary.previous.expenseInCents, false),
    },
    transactionCount: summary.current.transactionCount,
  };
}

export function selectMonthlyEvolution(data: DashboardMonthlyData[]): DashboardMonthlyViewModel[] {
  return data.map((item) => ({
    ...item,
    formattedIncome: formatCurrencyFromCents(item.incomeInCents),
    formattedExpense: formatCurrencyFromCents(item.expenseInCents),
  }));
}

export function selectCategoryDistribution(
  data: DashboardCategoryData[],
): DashboardCategoryViewModel[] {
  const sorted = data
    .filter((item) => item.amountInCents > 0)
    .sort((first, second) => second.amountInCents - first.amountInCents);
  const visible = sorted.slice(0, 4);
  const remaining = sorted.slice(4).reduce((total, item) => total + item.amountInCents, 0);
  const grouped = remaining > 0
    ? [...visible, { categoryId: "other", category: "Outros", amountInCents: remaining }]
    : visible;
  const total = grouped.reduce((sumValue, item) => sumValue + item.amountInCents, 0);

  return grouped.map((item, index) => {
    const percentage = total === 0 ? 0 : (item.amountInCents / total) * 100;
    return {
      ...item,
      formattedAmount: formatCurrencyFromCents(item.amountInCents),
      percentage,
      formattedPercentage: `${percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    };
  });
}
