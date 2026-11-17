import { Suspense } from "react";
import { lazyWithPreload } from "@dashboard/lib/lazyWithPreload";
import type { TrendLineChartProps } from "./interface";
import { ChartSkeleton } from "./styled";

/** chart.js + react-chartjs-2 ficam fora do chunk da página. */
export const LazyTrendLineChart = lazyWithPreload<TrendLineChartProps>(
  () => import("./index"),
);

/**
 * Versão lazy do gráfico com skeleton decorativo. O fallback é `aria-hidden`
 * porque o gráfico também é: a página já expõe a tabela acessível.
 */
export function TrendLineChartSuspense(props: TrendLineChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton aria-hidden="true" />}>
      <LazyTrendLineChart {...props} />
    </Suspense>
  );
}
