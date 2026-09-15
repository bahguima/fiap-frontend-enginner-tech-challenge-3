import { Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

import { AnimatedDisclosure } from "@mobile/components/dashboard/AnimatedDisclosure";
import { useReducedMotion } from "@mobile/features/dashboard/hooks/useReducedMotion";
import type { DashboardCategoryViewModel } from "@mobile/features/dashboard/types";

interface CategoryDistributionCardProps {
  data: DashboardCategoryViewModel[];
  periodLabel: string;
}

export function CategoryDistributionCard({
  data,
  periodLabel,
}: CategoryDistributionCardProps) {
  const reduceMotion = useReducedMotion();
  const total = data.reduce((sum, item) => sum + item.amountInCents, 0);
  const accessibilityLabel = `Distribuição das saídas de ${periodLabel} por categoria. ${data
    .map(
      (category) =>
        `${category.category}: ${category.formattedAmount}, ${category.formattedPercentage}`,
    )
    .join("; ")}.`;

  return (
    <View
      className="rounded-panel border border-bytebank-border bg-bytebank-surface p-5 shadow-card dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
    >
      <Text
        accessibilityRole="header"
        className="text-lg font-bold text-bytebank-text dark:text-bytebank-dark-text"
      >
        Distribuição por categoria
      </Text>
      <Text className="mt-1 text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
        Despesas no período
      </Text>

      {data.length === 0 ? (
        <Text className="mt-5 text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
          Nenhuma saída concluída neste período.
        </Text>
      ) : (
        <>
          <View
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
            className="mt-5 items-center"
            testID="category-chart"
          >
            <View aria-hidden>
              <PieChart
                animationDuration={500}
                centerLabelComponent={() => (
                  <View className="items-center">
                    <Text className="text-xs text-bytebank-muted dark:text-bytebank-dark-muted">Total</Text>
                    <Text className="mt-1 text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text">
                      {(total / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                  </View>
                )}
                data={data.map((item) => ({ value: item.amountInCents, color: item.color }))}
                donut
                innerRadius={55}
                isAnimated={!reduceMotion}
                radius={84}
              />
            </View>
          </View>

          <View aria-hidden className="mt-5 flex-row flex-wrap gap-x-4 gap-y-3">
            {data.map((category) => (
              <View className="flex-row items-center gap-2" key={category.categoryId}>
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                <Text className="text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
                  {category.category} · {category.formattedPercentage}
                </Text>
              </View>
            ))}
          </View>

          <AnimatedDisclosure label="tabela da distribuição por categoria">
            <View accessibilityRole="list" className="pt-2">
              {data.map((category) => (
                <View
                  accessibilityLabel={`${category.category}, ${category.formattedAmount}, ${category.formattedPercentage}`}
                  className="flex-row border-b border-bytebank-border py-2 dark:border-bytebank-dark-border"
                  key={category.categoryId}
                >
                  <Text className="flex-1 text-xs text-bytebank-text dark:text-bytebank-dark-text">{category.category}</Text>
                  <Text className="text-right text-xs text-bytebank-text dark:text-bytebank-dark-text">
                    {category.formattedAmount} · {category.formattedPercentage}
                  </Text>
                </View>
              ))}
            </View>
          </AnimatedDisclosure>
        </>
      )}
    </View>
  );
}
