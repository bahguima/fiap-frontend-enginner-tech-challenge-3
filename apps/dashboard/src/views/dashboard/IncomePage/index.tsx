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

import { ChartPanel, IncomeValue, SummaryLabel, SummaryPanel } from "./styled";
import { SensitiveValue } from "@dashboard/components/SensitiveValue";

export default function IncomePage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const transactionsQuery = useTransactionsQuery({ type: "income" });
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
            label: t("dash.income"),
            data: monthly?.incomeValues ?? [],
            borderColor: colors.income,
            backgroundColor: hslVar("--success", 0.18),
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors.income,
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
        <PageTitle>{t("income.title")}</PageTitle>
        <PageSubtitle>{t("income.subtitle")}</PageSubtitle>
      </div>

      {summaryQuery.isPending && (
        <QueryState kind="loading" message="Carregando total de entradas..." />
      )}
      {summaryQuery.isError && (
        <QueryState
          kind="error"
          message="Não foi possível carregar o total de entradas."
          onRetry={() => summaryQuery.refetch()}
        />
      )}
      {summaryQuery.data && (
        <SummaryPanel>
          <SummaryLabel>{t("income.total")}</SummaryLabel>
          <IncomeValue>
            +<SensitiveValue>{summaryQuery.data.totalIncome.formattedValue}</SensitiveValue>
          </IncomeValue>
        </SummaryPanel>
      )}

      <ChartPanel>
        <CardTitle>{t("income.trend")}</CardTitle>
        {monthlyQuery.isPending && (
          <QueryState kind="loading" message="Carregando evolução das entradas..." />
        )}
        {monthlyQuery.isError && (
          <QueryState
            kind="error"
            message="Não foi possível carregar a evolução das entradas."
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
        <CardTitle>{t("income.transactions")}</CardTitle>
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
          <QueryState kind="empty" message="Nenhuma entrada encontrada." />
        )}
        {transactionsQuery.data && transactionsQuery.data.items.length > 0 && (
          <TransactionTable data={transactionsQuery.data.items} />
        )}
      </PageStack>
    </PageStack>
  );
}
