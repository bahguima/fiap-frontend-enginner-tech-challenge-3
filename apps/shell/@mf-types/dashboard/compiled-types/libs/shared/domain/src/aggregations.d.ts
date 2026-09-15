import type { Transaction } from "@banking/shared/types";
export interface FinancialAggregation {
    balanceInCents: number;
    totalIncomeInCents: number;
    totalExpenseInCents: number;
    completedTransactions: number;
}
export declare function aggregateFinancialTransactions(transactions: readonly Transaction[]): FinancialAggregation;
