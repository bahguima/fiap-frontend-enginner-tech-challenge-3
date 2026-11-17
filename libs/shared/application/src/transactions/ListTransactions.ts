import type {
  TransactionsRepository,
  TransactionsRepositoryListOptions,
} from "@banking/shared/domain";
import type {
  TransactionListFilters,
  TransactionListResponse,
} from "@banking/shared/types";

export class ListTransactions {
  constructor(private readonly repository: TransactionsRepository) {}

  execute(
    filters: TransactionListFilters = {},
    options: TransactionsRepositoryListOptions = {},
  ): Promise<TransactionListResponse> {
    return this.repository.list(filters, options);
  }
}
