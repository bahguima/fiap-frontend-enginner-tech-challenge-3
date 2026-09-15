import type { Transaction } from "@banking/shared/types";
import { aggregateFinancialTransactions } from "./aggregations";

const baseTransaction: Transaction = {
  id: "transaction-1",
  description: "Teste",
  observation: "",
  amountInCents: 10000,
  type: "income",
  categoryId: "category-1",
  category: "Transferência",
  date: "2026-09-01",
  status: "completed",
  attachmentCount: 0,
};

describe("agregações do dashboard", () => {
  it("soma somente transações concluídas usando centavos", () => {
    const result = aggregateFinancialTransactions([
      baseTransaction,
      { ...baseTransaction, id: "2", type: "expense", amountInCents: 2550 },
      { ...baseTransaction, id: "3", status: "pending", amountInCents: 999999 },
    ]);

    expect(result).toEqual({
      balanceInCents: 7450,
      totalIncomeInCents: 10000,
      totalExpenseInCents: 2550,
      completedTransactions: 2,
    });
  });
});
