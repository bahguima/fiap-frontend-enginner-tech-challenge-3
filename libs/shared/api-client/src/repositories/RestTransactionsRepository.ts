import type {
  CancellationSignal,
  TransactionsRepository,
  TransactionsRepositoryListOptions,
} from "@banking/shared/domain";
import type {
  CreateTransactionRequest,
  TransactionListFilters,
  TransactionListResponse,
  TransactionViewModel,
  UpdateTransactionRequest,
} from "@banking/shared/types";
import { transactionsApi, type TransactionsApi } from "../transactions";

/**
 * Adaptador de infraestrutura: implementa a porta `TransactionsRepository`
 * sobre o cliente REST existente. Os contratos HTTP não mudam.
 */
export class RestTransactionsRepository implements TransactionsRepository {
  constructor(private readonly api: TransactionsApi = transactionsApi) {}

  list(
    filters: TransactionListFilters = {},
    options: TransactionsRepositoryListOptions = {},
  ): Promise<TransactionListResponse> {
    return this.api.list(filters, toAbortSignal(options.signal));
  }

  create(transaction: CreateTransactionRequest): Promise<TransactionViewModel> {
    return this.api.create(transaction);
  }

  update(
    transactionId: string,
    transaction: UpdateTransactionRequest,
  ): Promise<TransactionViewModel> {
    return this.api.update(transactionId, transaction);
  }

  async remove(transactionId: string): Promise<void> {
    await this.api.remove(transactionId);
  }
}

function toAbortSignal(
  signal: CancellationSignal | undefined,
): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined") return undefined;
  return signal instanceof AbortSignal ? signal : undefined;
}
