import type { TransactionsRepository } from "@banking/shared/domain";
import { assertTransactionId } from "./errors";

export class DeleteTransaction {
  constructor(private readonly repository: TransactionsRepository) {}

  async execute(transactionId: string): Promise<void> {
    assertTransactionId(transactionId);
    await this.repository.remove(transactionId);
  }
}
