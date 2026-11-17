import type { TransactionListFilters } from "@banking/shared/types";

/**
 * Fábrica tipada de query keys do domínio de transações.
 *
 * Cada key é derivada da raiz (`all`), o que garante prefixos consistentes
 * para invalidação hierárquica (`all` > `lists` > `list(filters)`). Os tipos
 * são inferidos como tuplas `readonly`, então consumidores (ex.:
 * `getQueriesData`) recebem a forma exata da key.
 */
const all = ["transactions"] as const;

export const transactionQueryKeys = {
  all,
  lists: () => [...all, "list"] as const,
  list: (filters: TransactionListFilters = {}) =>
    [...all, "list", filters] as const,
  categories: () => [...all, "categories"] as const,
  attachments: () => [...all, "attachments"] as const,
  attachmentList: (transactionId: string) =>
    [...all, "attachments", transactionId] as const,
} as const;

export type TransactionQueryKeys = typeof transactionQueryKeys;

type QueryKeyOf<TFactory> = TFactory extends (...args: never[]) => infer TKey
  ? TKey
  : TFactory;

/** União de todas as keys produzidas pela fábrica. */
export type TransactionQueryKey = {
  [TName in keyof TransactionQueryKeys]: QueryKeyOf<TransactionQueryKeys[TName]>;
}[keyof TransactionQueryKeys];

export type TransactionListQueryKey = QueryKeyOf<TransactionQueryKeys["list"]>;

export function isTransactionListQueryKey(
  queryKey: readonly unknown[],
): queryKey is TransactionListQueryKey {
  return (
    queryKey[0] === all[0] &&
    queryKey[1] === "list" &&
    typeof queryKey[2] === "object" &&
    queryKey[2] !== null
  );
}
