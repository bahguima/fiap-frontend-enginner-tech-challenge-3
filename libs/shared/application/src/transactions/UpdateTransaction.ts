import type { TransactionsRepository } from "@banking/shared/domain";
import type {
  TransactionViewModel,
  UpdateTransactionRequest,
} from "@banking/shared/types";
import { assertTransactionId } from "./errors";

export interface UpdateTransactionInput {
  transactionId: string;
  transaction: UpdateTransactionRequest;
}

export class UpdateTransaction {
  constructor(private readonly repository: TransactionsRepository) {}

  async execute({
    transactionId,
    transaction,
  }: UpdateTransactionInput): Promise<TransactionViewModel> {
    assertTransactionId(transactionId);
    return this.repository.update(transactionId, transaction);
  }
}
