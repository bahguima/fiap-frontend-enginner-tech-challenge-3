import type { Transaction } from "@banking/shared/types";

export interface FinancialAggregation {
  balanceInCents: number;
  totalIncomeInCents: number;
  totalExpenseInCents: number;
  completedTransactions: number;
}

export function aggregateFinancialTransactions(transactions: readonly Transaction[]): FinancialAggregation {
  let totalIncomeInCents = 0;
  let totalExpenseInCents = 0;
  let completedTransactions = 0;

  for (const transaction of transactions) {
    if (transaction.status !== "completed") continue;
    completedTransactions += 1;
    const amountInCents = Math.abs(transaction.amountInCents);
    if (transaction.type === "income") totalIncomeInCents += amountInCents;
    else totalExpenseInCents += amountInCents;
  }

  return {
    balanceInCents: totalIncomeInCents - totalExpenseInCents,
    totalIncomeInCents,
    totalExpenseInCents,
    completedTransactions,
  };
}
