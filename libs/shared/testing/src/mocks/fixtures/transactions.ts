import type {
  TransactionCategoryName,
  TransactionStatus,
  TransactionType,
} from "@banking/shared/types";

export interface MockTransactionSeed {
  id: string;
  description: string;
  amountInCents: number;
  type: TransactionType;
  category: TransactionCategoryName;
  date: string;
  status: TransactionStatus;
  observation?: string;
}

export const mockTransactionSeeds: MockTransactionSeed[] = [
  {
    id: "transaction-1",
    description: "Depósito de salário",
    amountInCents: 850000,
    type: "income",
    category: "Depósito",
    date: "2026-04-10",
    status: "completed",
  },
  {
    id: "transaction-2",
    description: "Assinatura de streaming",
    amountInCents: 5990,
    type: "expense",
    category: "Pagamento",
    date: "2026-04-09",
    status: "completed",
  },
  {
    id: "transaction-3",
    description: "Compra no mercado",
    amountInCents: 42743,
    type: "expense",
    category: "Pagamento",
    date: "2026-04-08",
    status: "completed",
  },
  {
    id: "transaction-4",
    description: "Pagamento de projeto",
    amountInCents: 220000,
    type: "income",
    category: "Transferência",
    date: "2026-04-07",
    status: "completed",
  },
  {
    id: "transaction-5",
    description: "Conta de energia",
    amountInCents: 18950,
    type: "expense",
    category: "Pagamento",
    date: "2026-04-06",
    status: "pending",
  },
  {
    id: "transaction-6",
    description: "Aplicação financeira",
    amountInCents: 50000,
    type: "expense",
    category: "Investimento",
    date: "2026-04-05",
    status: "failed",
  },
];
