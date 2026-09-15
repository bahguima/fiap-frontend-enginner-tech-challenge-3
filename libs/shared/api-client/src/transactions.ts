import type {
  ApiMessageResponse,
  CreateTransactionRequest,
  TransactionViewModel,
  TransactionListFilters,
  TransactionListResponse,
  UpdateTransactionRequest,
} from "@banking/shared/types";
import { restClient } from "./client";
import { apiEndpoints } from "./endpoints";

export interface TransactionsApi {
  list: (
    filters?: TransactionListFilters,
    signal?: AbortSignal,
  ) => Promise<TransactionListResponse>;
  create: (transaction: CreateTransactionRequest) => Promise<TransactionViewModel>;
  update: (
    transactionId: string,
    transaction: UpdateTransactionRequest,
  ) => Promise<TransactionViewModel>;
  remove: (transactionId: string) => Promise<ApiMessageResponse>;
}

export const transactionsApi: TransactionsApi = {
  list: (filters = {}, signal) =>
    restClient.request<TransactionListResponse>(
      createTransactionListUrl(filters),
      { signal },
    ),
  create: (transaction) =>
    restClient.request<TransactionViewModel, CreateTransactionRequest>(
      apiEndpoints.transactions.list,
      {
        method: "POST",
        body: transaction,
      },
    ),
  update: (transactionId, transaction) =>
    restClient.request<TransactionViewModel, UpdateTransactionRequest>(
      apiEndpoints.transactions.detail(transactionId),
      {
        method: "PUT",
        body: transaction,
      },
    ),
  remove: (transactionId) =>
    restClient.request<ApiMessageResponse>(
      apiEndpoints.transactions.detail(transactionId),
      {
        method: "DELETE",
      },
    ),
};

function createTransactionListUrl(filters: TransactionListFilters) {
  const searchParams = new URLSearchParams();

  if (filters.type) searchParams.set("type", filters.type);
  if (filters.search) searchParams.set("search", filters.search);
  if (filters.category) searchParams.set("category", filters.category);
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.startDate) searchParams.set("startDate", filters.startDate);
  if (filters.endDate) searchParams.set("endDate", filters.endDate);
  if (filters.minimumAmount !== undefined) {
    searchParams.set("minimumAmount", `${filters.minimumAmount}`);
  }
  if (filters.maximumAmount !== undefined) {
    searchParams.set("maximumAmount", `${filters.maximumAmount}`);
  }
  if (filters.sort) searchParams.set("sort", filters.sort);
  if (filters.page !== undefined) searchParams.set("page", `${filters.page}`);
  if (filters.pageSize !== undefined) {
    searchParams.set("pageSize", `${filters.pageSize}`);
  }
  if (filters.limit !== undefined) searchParams.set("limit", `${filters.limit}`);

  const query = searchParams.toString();
  return query ? `${apiEndpoints.transactions.list}?${query}` : apiEndpoints.transactions.list;
}
