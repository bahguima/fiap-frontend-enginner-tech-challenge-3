import type { TransactionSort } from "@banking/shared/types";

import type { TransactionFilters } from "@mobile/features/transactions/types/transactions";

export interface NormalizedTransactionFilters {
  type?: TransactionFilters["type"];
  categoryId?: string;
  status?: TransactionFilters["status"];
  startDate?: string;
  endDate?: string;
  sort: TransactionSort;
  pageSize: number;
}

export function normalizeTransactionFilters(
  filters: TransactionFilters = {},
): NormalizedTransactionFilters {
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId?.trim()
      ? { categoryId: filters.categoryId.trim() }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    sort: filters.sort ?? "date-desc",
    pageSize: filters.pageSize ?? 20,
  };
}

const mobileRoot = ["mobile"] as const;
const userRoot = (uid: string) => [...mobileRoot, "users", uid] as const;

export const mobileUserQueryKeys = {
  all: (uid: string) => userRoot(uid),
};

export const transactionQueryKeys = {
  all: (uid: string) => [...userRoot(uid), "transactions"] as const,
  lists: (uid: string) =>
    [...transactionQueryKeys.all(uid), "lists"] as const,
  infinite: (uid: string, filters: TransactionFilters = {}) =>
    [
      ...transactionQueryKeys.lists(uid),
      "infinite",
      normalizeTransactionFilters(filters),
    ] as const,
  details: (uid: string) =>
    [...transactionQueryKeys.all(uid), "details"] as const,
  detail: (uid: string, id: string) =>
    [...transactionQueryKeys.details(uid), id] as const,
};

export const transactionCategoryQueryKeys = {
  all: [...mobileRoot, "transaction-categories"] as const,
  list: () => [...transactionCategoryQueryKeys.all, "list"] as const,
};

export const dashboardQueryKeys = {
  all: (uid: string) => [...userRoot(uid), "dashboard"] as const,
  summary: (uid: string, period: string) =>
    [...dashboardQueryKeys.all(uid), "summary", period] as const,
  monthly: (uid: string, period: string) =>
    [...dashboardQueryKeys.all(uid), "monthly", period] as const,
  categories: (uid: string, period: string) =>
    [...dashboardQueryKeys.all(uid), "categories", period] as const,
  recent: (uid: string) => [...dashboardQueryKeys.all(uid), "recent"] as const,
};

export const transactionAttachmentQueryKeys = {
  all: (uid: string) =>
    [...userRoot(uid), "transaction-attachments"] as const,
  byTransaction: (uid: string, transactionId: string) =>
    [
      ...transactionAttachmentQueryKeys.all(uid),
      "transaction",
      transactionId,
    ] as const,
};
