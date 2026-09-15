import { useMemo } from "react";
import { Platform, Text, useWindowDimensions, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { AnimatedDisclosure } from "@mobile/components/dashboard/AnimatedDisclosure";
import { useReducedMotion } from "@mobile/features/dashboard/hooks/useReducedMotion";
import type { DashboardMonthlyViewModel } from "@mobile/features/dashboard/types";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface FinancialFlowCardProps {
  data: DashboardMonthlyViewModel[];
}

export function FinancialFlowCard({ data }: FinancialFlowCardProps) {
  const { width } = useWindowDimensions();
  const { isDark } = useMobileTheme();
  const reduceMotion = useReducedMotion();
  const palette = isDark ? darkColors : colors;
  const incomeColor = isDark ? darkColors.success : "#0f7a55";
  const chartData = useMemo(
    () =>
      data.flatMap((period) => [
        {
          value: period.incomeInCents / 100,
          label: period.month.shortLabel,
          labelWidth: 28,
          frontColor: incomeColor,
          spacing: 3,
        },
        {
          value: period.expenseInCents / 100,
          frontColor: palette.danger,
          spacing: 16,
        },
      ]),
    [data, incomeColor, palette.danger],
  );
  const accessibilityLabel = `Evolução mensal de entradas e saídas. ${data
    .map(
      (period) =>
        `${period.month.longLabel}: entradas ${period.formattedIncome}, saídas ${period.formattedExpense}`,
    )
    .join("; ")}.`;

  return (
    <View
      className="rounded-panel border border-bytebank-border bg-bytebank-surface p-5 shadow-card dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
    >
      <View className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <View>
          <Text
            accessibilityRole="header"
            className="text-lg font-bold text-bytebank-text dark:text-bytebank-dark-text"
          >
            Evolução mensal
          </Text>
          <Text className="mt-1 text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
            Últimos 6 meses
          </Text>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-sm bg-bytebank-success dark:bg-bytebank-dark-success" />
            <Text className="text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
              Entradas
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-sm bg-bytebank-danger dark:bg-bytebank-dark-danger" />
            <Text className="text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
              Saídas
            </Text>
          </View>
        </View>
      </View>

      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
        className="mt-5 items-center"
        testID="monthly-chart"
      >
        <View aria-hidden>
          <BarChart
            adjustToWidth
            animationDuration={500}
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
            barWidth={10}
            data={chartData}
            disableScroll
            height={180}
            hideRules
            isAnimated={!reduceMotion && Platform.OS !== "web"}
            noOfSections={4}
            width={Math.max(230, Math.min(width - 88, 600))}
            xAxisColor={palette.border}
            xAxisLabelTextStyle={{ color: palette.muted, fontSize: 10 }}
            yAxisColor="transparent"
            yAxisLabelPrefix="R$ "
            yAxisTextStyle={{ color: palette.muted, fontSize: 9 }}
          />
        </View>
      </View>

      <AnimatedDisclosure label="tabela da evolução mensal">
        <View accessibilityRole="list" className="pt-2">
          <View className="flex-row border-b border-bytebank-border py-2 dark:border-bytebank-dark-border">
            <Text className="flex-1 text-xs font-bold text-bytebank-muted dark:text-bytebank-dark-muted">Mês</Text>
            <Text className="flex-1 text-right text-xs font-bold text-bytebank-muted dark:text-bytebank-dark-muted">Entradas</Text>
            <Text className="flex-1 text-right text-xs font-bold text-bytebank-muted dark:text-bytebank-dark-muted">Saídas</Text>
          </View>
          {data.map((period) => (
            <View className="flex-row py-2" key={period.month.key}>
              <Text className="flex-1 text-xs text-bytebank-text dark:text-bytebank-dark-text">{period.month.shortLabel}</Text>
              <Text className="flex-1 text-right text-xs text-bytebank-text dark:text-bytebank-dark-text">{period.formattedIncome}</Text>
              <Text className="flex-1 text-right text-xs text-bytebank-text dark:text-bytebank-dark-text">{period.formattedExpense}</Text>
            </View>
          ))}
        </View>
      </AnimatedDisclosure>
    </View>
  );
}
