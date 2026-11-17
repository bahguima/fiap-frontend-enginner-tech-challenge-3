import type { ChartData, ChartOptions } from "chart.js";

export interface TrendLineChartProps {
  data: ChartData<"line">;
  options: ChartOptions<"line">;
}
