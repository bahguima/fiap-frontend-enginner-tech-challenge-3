import type {
  Transaction,
  TransactionCategory,
  TransactionSort,
  TransactionStatus,
  TransactionType,
} from "@banking/shared/types";

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  sort?: TransactionSort;
  pageSize?: number;
}

export interface TransactionCursor {
  orderValue: string | number;
  createdAtMillis: number;
  id: string;
}

export interface TransactionPage {
  items: Transaction[];
  nextCursor?: TransactionCursor;
}

export type TransactionInput = Omit<
  Transaction,
  "id" | "attachmentCount"
>;

export interface TransactionsRepository {
  create(uid: string, input: TransactionInput): Promise<Transaction>;
  getById(uid: string, id: string): Promise<Transaction>;
  update(
    uid: string,
    id: string,
    input: TransactionInput,
  ): Promise<Transaction>;
  delete(uid: string, id: string): Promise<void>;
  list(
    uid: string,
    filters: TransactionFilters,
    cursor?: TransactionCursor,
  ): Promise<TransactionPage>;
  listCategories(uid: string): Promise<TransactionCategory[]>;
}

export interface UpdateTransactionVariables {
  id: string;
  input: TransactionInput;
}
