import type { Transaction } from "@banking/shared/types";

export interface DashboardDateRange {
  startDate: string;
  endDate: string;
}

export interface DashboardMonth extends DashboardDateRange {
  key: string;
  shortLabel: string;
  longLabel: string;
}

export interface DashboardPeriod extends DashboardDateRange {
  key: string;
  label: string;
  previous: DashboardDateRange;
  months: DashboardMonth[];
}

export interface DashboardAggregate {
  transactionCount: number;
  incomeInCents: number;
  expenseInCents: number;
}

export interface DashboardSummaryData {
  balanceInCents: number;
  current: DashboardAggregate;
  previous: DashboardAggregate;
}

export interface DashboardMonthlyData {
  month: DashboardMonth;
  incomeInCents: number;
  expenseInCents: number;
}

export interface DashboardCategoryData {
  categoryId: string;
  category: string;
  amountInCents: number;
}

export interface DashboardRepository {
  getSummary(uid: string, period: DashboardPeriod): Promise<DashboardSummaryData>;
  getMonthlyEvolution(uid: string, months: DashboardMonth[]): Promise<DashboardMonthlyData[]>;
  getCategoryDistribution(uid: string, range: DashboardDateRange): Promise<DashboardCategoryData[]>;
  getRecentTransactions(uid: string, maximum?: number): Promise<Transaction[]>;
}

export type DashboardComparisonTone = "positive" | "negative" | "neutral";

export interface DashboardMetricViewModel {
  label: string;
  valueInCents: number;
  formattedValue: string;
  comparisonText: string;
  comparisonTone: DashboardComparisonTone;
}

export interface DashboardMonthlyViewModel extends DashboardMonthlyData {
  formattedIncome: string;
  formattedExpense: string;
}

export interface DashboardCategoryViewModel extends DashboardCategoryData {
  formattedAmount: string;
  percentage: number;
  formattedPercentage: string;
  color: string;
}

export interface DashboardIndicatorsViewModel {
  balance: DashboardMetricViewModel;
  totalIncome: DashboardMetricViewModel;
  totalExpense: DashboardMetricViewModel;
  transactionCount: number;
}
