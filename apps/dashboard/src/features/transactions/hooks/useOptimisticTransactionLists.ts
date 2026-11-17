import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import type {
  TransactionListFilters,
  TransactionListResponse,
} from "@banking/shared/types";
import { dashboardQueryKeys } from "@dashboard/features/dashboard/api/queryKeys";
import {
  isTransactionListQueryKey,
  transactionQueryKeys,
} from "../api/queryKeys";

export type TransactionListUpdater = (
  list: TransactionListResponse,
  filters: TransactionListFilters,
) => TransactionListResponse;

/** Snapshot devolvido por `onMutate` e consumido por `onError` (rollback). */
export interface OptimisticTransactionContext {
  previousLists: Array<[QueryKey, TransactionListResponse]>;
}

let optimisticSequence = 0;

export function createOptimisticTransactionId(): string {
  optimisticSequence += 1;
  return `optimistic-transaction-${Date.now().toString(36)}-${optimisticSequence}`;
}

/**
 * Ciclo de atualização otimista das listas de transações:
 * - `apply` (onMutate): cancela buscas em andamento, tira snapshot de todas
 *   as listas em cache e aplica o updater em cada uma;
 * - `rollback` (onError): restaura o snapshot;
 * - `settle` (onSettled): invalida somente as keys de transações e os
 *   agregados do dashboard que dependem delas.
 */
export function useOptimisticTransactionLists() {
  const queryClient = useQueryClient();

  const apply = async (
    updater: TransactionListUpdater,
  ): Promise<OptimisticTransactionContext> => {
    await queryClient.cancelQueries({ queryKey: transactionQueryKeys.lists() });

    const previousLists: OptimisticTransactionContext["previousLists"] = [];

    for (const [queryKey, list] of queryClient.getQueriesData<TransactionListResponse>(
      { queryKey: transactionQueryKeys.lists() },
    )) {
      if (!list || !isTransactionListQueryKey(queryKey)) continue;

      previousLists.push([queryKey, list]);
      queryClient.setQueryData<TransactionListResponse>(
        queryKey,
        updater(list, queryKey[2]),
      );
    }

    return { previousLists };
  };

  const rollback = (context: OptimisticTransactionContext | undefined) => {
    for (const [queryKey, list] of context?.previousLists ?? []) {
      queryClient.setQueryData<TransactionListResponse>(queryKey, list);
    }
  };

  const settle = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all }),
    ]);

  return { apply, rollback, settle };
}
