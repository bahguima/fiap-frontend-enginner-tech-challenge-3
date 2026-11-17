// Apenas utilitários de cor: o registro do chart.js fica em
// `components/dashboard/TrendLineChart`, carregado sob demanda.

export function hslVar(name: string, alpha = 1): string {
  if (typeof window === "undefined") return `hsl(0 0% 0% / ${alpha})`;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return `hsl(0 0% 0% / ${alpha})`;
  return alpha === 1 ? `hsl(${raw})` : `hsl(${raw} / ${alpha})`;
}

export function getChartColors(themeVersion?: string) {
  const themeClass = themeVersion ?? "";

  return {
    income: hslVar("--success"),
    incomeSoft: hslVar("--success", 0.25),
    expense: hslVar("--destructive"),
    expenseSoft: hslVar("--destructive", 0.25),
    grid: hslVar("--border", 0.6),
    text: hslVar("--muted-foreground"),
    tooltipBg: hslVar("--card"),
    tooltipBorder: hslVar("--border"),
    tooltipText: hslVar("--foreground"),
    themeClass,
  };
}
