import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react-native";
import { useWindowDimensions, View } from "react-native";

import type { DashboardIndicatorsViewModel } from "@mobile/features/dashboard/types";
import { FinancialMetricCard } from "./FinancialMetricCard";

type Metrics = Pick<
  DashboardIndicatorsViewModel,
  "balance" | "totalIncome" | "totalExpense"
>;

export function FinancialMetricsSection({
  balance,
  totalIncome,
  totalExpense,
}: Metrics) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;

  return (
    <View className="gap-3">
      <FinancialMetricCard
        featured
        icon={Wallet}
        metric={balance}
        tone="primary"
      />
      <View className={isSmallScreen ? "gap-3" : "flex-row gap-3"}>
        <View className="min-w-0 flex-1">
          <FinancialMetricCard
            icon={ArrowDownLeft}
            metric={totalIncome}
            tone="success"
          />
        </View>
        <View className="min-w-0 flex-1">
          <FinancialMetricCard
            icon={ArrowUpRight}
            metric={totalExpense}
            tone="expense"
          />
        </View>
      </View>
    </View>
  );
}
