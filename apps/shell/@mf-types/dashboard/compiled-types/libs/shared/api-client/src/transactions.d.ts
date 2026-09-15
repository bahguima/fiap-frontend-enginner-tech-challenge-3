import type { ApiMessageResponse, CreateTransactionRequest, TransactionViewModel, TransactionListFilters, TransactionListResponse, UpdateTransactionRequest } from "@banking/shared/types";
export interface TransactionsApi {
    list: (filters?: TransactionListFilters, signal?: AbortSignal) => Promise<TransactionListResponse>;
    create: (transaction: CreateTransactionRequest) => Promise<TransactionViewModel>;
    update: (transactionId: string, transaction: UpdateTransactionRequest) => Promise<TransactionViewModel>;
    remove: (transactionId: string) => Promise<ApiMessageResponse>;
}
export declare const transactionsApi: TransactionsApi;
