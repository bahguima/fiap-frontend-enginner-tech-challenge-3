import type { Transaction, TransactionDocument, TransactionStatus, TransactionViewModel } from "@banking/shared/types";
import { formatCalendarDate } from "./date";
import { formatCurrencyFromCents, fromAmountInCents } from "./money";

export function transactionDocumentToDomain<TTimestamp>(id: string, rawTransaction: TransactionDocument<TTimestamp>): Transaction {
  return {
    id,
    description: rawTransaction.description,
    observation: rawTransaction.observation,
    amountInCents: rawTransaction.amountInCents,
    type: rawTransaction.type,
    categoryId: rawTransaction.categoryId,
    category: rawTransaction.categoryName,
    date: rawTransaction.occurredOn,
    status: rawTransaction.status,
    attachmentCount: rawTransaction.attachmentCount,
  };
}

export function transactionToViewModel(transaction: Transaction): TransactionViewModel {
  const direction = transaction.type === "income" ? 1 : -1;
  const absoluteAmountInCents = Math.abs(transaction.amountInCents);

  return {
    ...transaction,
    amount: direction * fromAmountInCents(absoluteAmountInCents),
    formattedAmount: `${direction > 0 ? "+" : "-"}${formatCurrencyFromCents(absoluteAmountInCents)}`,
    typeLabel: transaction.type === "income" ? "Entrada" : "Saída",
    formattedDate: formatCalendarDate(transaction.date),
    statusLabel: getTransactionStatusLabel(transaction.status),
    editableFields: {
      description: transaction.description,
      amount: fromAmountInCents(absoluteAmountInCents),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      status: transaction.status,
      observation: transaction.observation,
    },
  };
}

export function getTransactionStatusLabel(status: TransactionStatus): string {
  if (status === "completed") return "Concluída";
  if (status === "pending") return "Pendente";
  return "Falhou";
}
