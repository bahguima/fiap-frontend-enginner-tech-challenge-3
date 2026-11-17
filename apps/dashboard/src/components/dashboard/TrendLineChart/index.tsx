"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { TrendLineChartProps } from "./interface";

// O registro do chart.js vive neste módulo para que a biblioteca inteira só
// seja baixada quando um gráfico for de fato renderizado (chunk lazy).
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

/**
 * Gráfico de linha decorativo (`aria-hidden`); a informação acessível é
 * entregue pela tabela visualmente oculta renderizada pela página.
 */
export function TrendLineChart({ data, options }: TrendLineChartProps) {
  return <Line aria-hidden="true" data={data} options={options} />;
}

export default TrendLineChart;
