import type { TransactionsRepository } from "@banking/shared/domain";
import { CreateTransaction } from "./CreateTransaction";
import { DeleteTransaction } from "./DeleteTransaction";
import { ListTransactions } from "./ListTransactions";
import { UpdateTransaction } from "./UpdateTransaction";

export interface TransactionUseCases {
  listTransactions: ListTransactions;
  createTransaction: CreateTransaction;
  updateTransaction: UpdateTransaction;
  deleteTransaction: DeleteTransaction;
}

/** Monta os casos de uso de transações sobre qualquer implementação da porta. */
export function createTransactionUseCases(
  repository: TransactionsRepository,
): TransactionUseCases {
  return {
    listTransactions: new ListTransactions(repository),
    createTransaction: new CreateTransaction(repository),
    updateTransaction: new UpdateTransaction(repository),
    deleteTransaction: new DeleteTransaction(repository),
  };
}
