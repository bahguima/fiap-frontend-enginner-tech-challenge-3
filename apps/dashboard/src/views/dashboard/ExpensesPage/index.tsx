"use client";

import { useMemo } from "react";
import { TrendLineChartSuspense } from "@dashboard/components/dashboard/TrendLineChart/lazy";
import { TransactionTable } from "@dashboard/components/dashboard/TransactionTable";
import { QueryState } from "@banking/shared/ui/components/QueryState";
import { useLanguage } from "@dashboard/contexts/LanguageContext";
import { useTheme } from "@dashboard/contexts/ThemeContext";
import {
  useDashboardMonthlyQuery,
  useDashboardSummaryQuery,
} from "@dashboard/features/dashboard/hooks/useDashboard";
import { useTransactionsQuery } from "@dashboard/features/transactions/hooks/useTransactions";
import { getChartColors, hslVar } from "@dashboard/lib/chart-theme";
import {
  CardTitle,
  ChartBox,
  PageStack,
  PageSubtitle,
  PageTitle,
  VisuallyHiddenTable,
} from "@banking/shared/ui/styles/shared";

import { ChartPanel, ExpenseValue, SummaryLabel, SummaryPanel } from "./styled";
import { SensitiveValue } from "@dashboard/components/SensitiveValue";

export default function ExpensesPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const transactionsQuery = useTransactionsQuery({ type: "expense" });
  const summaryQuery = useDashboardSummaryQuery();
  const monthlyQuery = useDashboardMonthlyQuery();

  const { data: chartData, options: chartOptions } = useMemo(() => {
    const colors = getChartColors(theme);
    const monthly = monthlyQuery.data;

    return {
      data: {
        labels: monthly?.labels ?? [],
        datasets: [
          {
            label: t("dash.expenses"),
            data: monthly?.expenseValues ?? [],
            borderColor: colors.expense,
            backgroundColor: hslVar("--destructive", 0.18),
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.expense,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            padding: 10,
          },
        },
        scales: {
          x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
          y: { ticks: { color: colors.text }, grid: { color: colors.grid } },
        },
      },
    };
  }, [monthlyQuery.data, theme, t]);

  return (
    <PageStack>
      <div>
        <PageTitle>{t("expenses.title")}</PageTitle>
        <PageSubtitle>{t("expenses.subtitle")}</PageSubtitle>
      </div>

      {summaryQuery.isPending && (
        <QueryState kind="loading" message="Carregando total de saídas..." />
      )}
      {summaryQuery.isError && (
        <QueryState
          kind="error"
          message="Não foi possível carregar o total de saídas."
          onRetry={() => summaryQuery.refetch()}
        />
      )}
      {summaryQuery.data && (
        <SummaryPanel>
          <SummaryLabel>{t("expenses.total")}</SummaryLabel>
          <ExpenseValue>
            -<SensitiveValue>{summaryQuery.data.totalExpense.formattedValue}</SensitiveValue>
          </ExpenseValue>
        </SummaryPanel>
      )}

      <ChartPanel>
        <CardTitle>{t("expenses.trend")}</CardTitle>
        {monthlyQuery.isPending && (
          <QueryState kind="loading" message="Carregando evolução das saídas..." />
        )}
        {monthlyQuery.isError && (
          <QueryState
            kind="error"
            message="Não foi possível carregar a evolução das saídas."
            onRetry={() => monthlyQuery.refetch()}
          />
        )}
        {monthlyQuery.data && (
          <ChartBox $height="14rem">
            <TrendLineChartSuspense data={chartData} options={chartOptions} />
          </ChartBox>
        )}
        {monthlyQuery.data && (
          <VisuallyHiddenTable>
            <caption>{monthlyQuery.data.accessibleDescription}</caption>
            <thead>
              <tr>
                <th scope="col">Período</th>
                <th scope="col">Entradas</th>
                <th scope="col">Saídas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{monthlyQuery.data.firstPeriod.label}</th>
                <td>
                  <SensitiveValue>{monthlyQuery.data.firstPeriod.income.formattedValue}</SensitiveValue>
                </td>
                <td>
                  <SensitiveValue>{monthlyQuery.data.firstPeriod.expense.formattedValue}</SensitiveValue>
                </td>
              </tr>
              <tr>
                <th scope="row">{monthlyQuery.data.secondPeriod.label}</th>
                <td>
                  <SensitiveValue>{monthlyQuery.data.secondPeriod.income.formattedValue}</SensitiveValue>
                </td>
                <td>
                  <SensitiveValue>{monthlyQuery.data.secondPeriod.expense.formattedValue}</SensitiveValue>
                </td>
              </tr>
              <tr>
                <th scope="row">{monthlyQuery.data.thirdPeriod.label}</th>
                <td>
                  <SensitiveValue>{monthlyQuery.data.thirdPeriod.income.formattedValue}</SensitiveValue>
                </td>
                <td>
                  <SensitiveValue>{monthlyQuery.data.thirdPeriod.expense.formattedValue}</SensitiveValue>
                </td>
              </tr>
              <tr>
                <th scope="row">{monthlyQuery.data.fourthPeriod.label}</th>
                <td>
                  <SensitiveValue>{monthlyQuery.data.fourthPeriod.income.formattedValue}</SensitiveValue>
                </td>
                <td>
                  <SensitiveValue>{monthlyQuery.data.fourthPeriod.expense.formattedValue}</SensitiveValue>
                </td>
              </tr>
              <tr>
                <th scope="row">{monthlyQuery.data.fifthPeriod.label}</th>
                <td>
                  <SensitiveValue>{monthlyQuery.data.fifthPeriod.income.formattedValue}</SensitiveValue>
                </td>
                <td>
                  <SensitiveValue>{monthlyQuery.data.fifthPeriod.expense.formattedValue}</SensitiveValue>
                </td>
              </tr>
              <tr>
                <th scope="row">{monthlyQuery.data.sixthPeriod.label}</th>
                <td>
                  <SensitiveValue>{monthlyQuery.data.sixthPeriod.income.formattedValue}</SensitiveValue>
                </td>
                <td>
                  <SensitiveValue>{monthlyQuery.data.sixthPeriod.expense.formattedValue}</SensitiveValue>
                </td>
              </tr>
            </tbody>
          </VisuallyHiddenTable>
        )}
      </ChartPanel>

      <PageStack $gap="1rem">
        <CardTitle>{t("expenses.transactions")}</CardTitle>
        {transactionsQuery.isPending && (
          <QueryState kind="loading" message="Carregando transações..." />
        )}
        {transactionsQuery.isError && (
          <QueryState
            kind="error"
            message="Não foi possível carregar as transações."
            onRetry={() => transactionsQuery.refetch()}
          />
        )}
        {transactionsQuery.data?.items.length === 0 && (
          <QueryState kind="empty" message="Nenhuma saída encontrada." />
        )}
        {transactionsQuery.data && transactionsQuery.data.items.length > 0 && (
          <TransactionTable data={transactionsQuery.data.items} />
        )}
      </PageStack>
    </PageStack>
  );
}
