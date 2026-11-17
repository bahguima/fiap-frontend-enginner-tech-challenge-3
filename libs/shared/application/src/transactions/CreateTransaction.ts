import type { TransactionsRepository } from "@banking/shared/domain";
import type {
  CreateTransactionRequest,
  TransactionViewModel,
} from "@banking/shared/types";

export class CreateTransaction {
  constructor(private readonly repository: TransactionsRepository) {}

  execute(transaction: CreateTransactionRequest): Promise<TransactionViewModel> {
    return this.repository.create(transaction);
  }
}
