import {
  createDashboardPeriod,
  selectCategoryDistribution,
  selectDashboardIndicators,
  selectMonthlyEvolution,
} from "./selectors";

describe("dashboard selectors", () => {
  it("creates a stable six-month period, including a year boundary", () => {
    const period = createDashboardPeriod(new Date(2026, 0, 15));

    expect(period).toMatchObject({
      key: "2026-01",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      previous: { startDate: "2025-12-01", endDate: "2025-12-31" },
    });
    expect(period.months.map((month) => month.key)).toEqual([
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
  });

  it("formats balance, income and expense without using transaction pages", () => {
    const result = selectDashboardIndicators({
      balanceInCents: 1_274_057,
      current: { transactionCount: 8, incomeInCents: 1_746_800, expenseInCents: 472_743 },
      previous: { transactionCount: 7, incomeInCents: 1_500_000, expenseInCents: 520_000 },
    });

    expect(result.balance.formattedValue).toBe("R$ 12.740,57");
    expect(result.totalIncome.formattedValue).toBe("R$ 17.468,00");
    expect(result.totalIncome.comparisonTone).toBe("positive");
    expect(result.totalExpense.comparisonTone).toBe("positive");
    expect(result.transactionCount).toBe(8);
  });

  it("returns a neutral comparison when the previous month has no base", () => {
    const result = selectDashboardIndicators({
      balanceInCents: 50_000,
      current: { transactionCount: 1, incomeInCents: 50_000, expenseInCents: 0 },
      previous: { transactionCount: 0, incomeInCents: 0, expenseInCents: 0 },
    });

    expect(result.totalIncome.comparisonTone).toBe("neutral");
    expect(result.totalIncome.comparisonText).toContain("Sem base");
  });

  it("formats monthly values and groups categories after the four largest", () => {
    const period = createDashboardPeriod(new Date(2026, 8, 14));
    const monthly = selectMonthlyEvolution([
      { month: period.months[5], incomeInCents: 750_000, expenseInCents: 28_590 },
    ]);
    const categories = selectCategoryDistribution([
      { categoryId: "a", category: "A", amountInCents: 500 },
      { categoryId: "b", category: "B", amountInCents: 400 },
      { categoryId: "c", category: "C", amountInCents: 300 },
      { categoryId: "d", category: "D", amountInCents: 200 },
      { categoryId: "e", category: "E", amountInCents: 100 },
      { categoryId: "zero", category: "Zero", amountInCents: 0 },
    ]);

    expect(monthly[0]).toMatchObject({ formattedIncome: "R$ 7.500,00", formattedExpense: "R$ 285,90" });
    expect(categories).toHaveLength(5);
    expect(categories[4]).toMatchObject({ category: "Outros", amountInCents: 100 });
    expect(categories.reduce((total, item) => total + item.percentage, 0)).toBeCloseTo(100);
  });
});
