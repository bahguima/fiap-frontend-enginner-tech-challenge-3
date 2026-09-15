import type { TransactionViewModel } from "./transactions";
export interface DashboardAmount {
    value: number;
    formattedValue: string;
}
export interface DashboardSummaryResponse {
    balance: DashboardAmount;
    totalIncome: DashboardAmount;
    totalExpense: DashboardAmount;
    savings: DashboardAmount;
}
export interface DashboardMonthlyResponse {
    accessibleDescription: string;
    labels: string[];
    incomeValues: number[];
    expenseValues: number[];
    firstPeriod: DashboardMonthlyPeriod;
    secondPeriod: DashboardMonthlyPeriod;
    thirdPeriod: DashboardMonthlyPeriod;
    fourthPeriod: DashboardMonthlyPeriod;
    fifthPeriod: DashboardMonthlyPeriod;
    sixthPeriod: DashboardMonthlyPeriod;
}
export interface DashboardMonthlyPeriod {
    label: string;
    income: DashboardAmount;
    expense: DashboardAmount;
}
export type DashboardComparisonTone = "positive" | "negative" | "neutral";
export interface DashboardMetric {
    label: string;
    amount: DashboardAmount;
    comparisonText: string;
    comparisonTone: DashboardComparisonTone;
}
export interface DashboardCashFlowPeriod {
    label: string;
    income: DashboardAmount;
    expense: DashboardAmount;
    incomeHeight: string;
    expenseHeight: string;
}
export interface DashboardCashFlow {
    title: string;
    accessibleDescription: string;
    firstPeriod: DashboardCashFlowPeriod;
    secondPeriod: DashboardCashFlowPeriod;
    thirdPeriod: DashboardCashFlowPeriod;
    fourthPeriod: DashboardCashFlowPeriod;
    fifthPeriod: DashboardCashFlowPeriod;
    sixthPeriod: DashboardCashFlowPeriod;
}
export type DashboardCategoryTone = "primary" | "accent" | "success" | "warning" | "muted";
export interface DashboardCategoryDistributionItem {
    label: string;
    amount: DashboardAmount;
    formattedPercentage: string;
    barWidth: string;
    tone: DashboardCategoryTone;
}
export interface DashboardCategoryDistribution {
    title: string;
    accessibleDescription: string;
    firstCategory: DashboardCategoryDistributionItem;
    secondCategory: DashboardCategoryDistributionItem;
    thirdCategory: DashboardCategoryDistributionItem;
    fourthCategory: DashboardCategoryDistributionItem;
    fifthCategory: DashboardCategoryDistributionItem;
}
export interface DashboardRecentTransactions {
    title: string;
    emptyMessage: string;
    firstTransaction: TransactionViewModel | null;
    secondTransaction: TransactionViewModel | null;
    thirdTransaction: TransactionViewModel | null;
    fourthTransaction: TransactionViewModel | null;
    fifthTransaction: TransactionViewModel | null;
}
export interface DashboardHomeSuccessResponse {
    status: "success";
    title: string;
    subtitle: string;
    periodLabel: string;
    balance: DashboardMetric;
    totalIncome: DashboardMetric;
    totalExpense: DashboardMetric;
    cashFlow: DashboardCashFlow;
    categoryDistribution: DashboardCategoryDistribution;
    recentTransactions: DashboardRecentTransactions;
}
export interface DashboardHomeEmptyResponse {
    status: "empty";
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyMessage: string;
}
export type DashboardHomeResponse = DashboardHomeSuccessResponse | DashboardHomeEmptyResponse;
