import type {
  CreateTransactionRequest,
  TransactionListFilters,
  TransactionListResponse,
  TransactionViewModel,
  UpdateTransactionRequest,
} from "@banking/shared/types";

/**
 * Sinal de cancelamento neutro de plataforma. Um `AbortSignal` do navegador
 * ou do Node satisfaz este contrato estruturalmente, mas o domínio não
 * depende de nenhuma API de plataforma.
 */
export interface CancellationSignal {
  readonly aborted: boolean;
}

export interface TransactionsRepositoryListOptions {
  signal?: CancellationSignal;
}

/**
 * Porta (Clean Architecture) para persistência de transações.
 *
 * O domínio define o contrato; a infraestrutura (REST, Firebase, memória)
 * o implementa. Os tipos são os contratos neutros de `@banking/shared/types`.
 */
export interface TransactionsRepository {
  list(
    filters?: TransactionListFilters,
    options?: TransactionsRepositoryListOptions,
  ): Promise<TransactionListResponse>;
  create(transaction: CreateTransactionRequest): Promise<TransactionViewModel>;
  update(
    transactionId: string,
    transaction: UpdateTransactionRequest,
  ): Promise<TransactionViewModel>;
  remove(transactionId: string): Promise<void>;
}
