import { queryOptions } from "@tanstack/react-query";
import type { TransactionUseCases } from "@banking/shared/application";
import { cachePolicies } from "@banking/shared/query";
import type { TransactionListFilters } from "@banking/shared/types";
import { attachmentsApi, categoriesApi } from "@banking/shared/api-client";
import { transactionQueryKeys } from "./queryKeys";

/**
 * Opções de consulta do domínio de transações, compartilhadas entre os hooks
 * e o prefetch de rota. A listagem recebe o caso de uso injetado
 * (`TransactionUseCasesProvider`) para não acoplar a fábrica ao transporte.
 *
 * Listas e anexos usam `cachePolicies.transactions` (dado volátil);
 * categorias usam `cachePolicies.categories` (catálogo quase estático, o
 * único domínio persistido entre recargas).
 */
export const transactionQueries = {
  list: (
    listTransactions: TransactionUseCases["listTransactions"],
    filters: TransactionListFilters = {},
  ) =>
    queryOptions({
      queryKey: transactionQueryKeys.list(filters),
      queryFn: ({ signal }) => listTransactions.execute(filters, { signal }),
      ...cachePolicies.transactions,
    }),
  attachments: (transactionId: string) =>
    queryOptions({
      queryKey: transactionQueryKeys.attachmentList(transactionId),
      queryFn: () => attachmentsApi.list(transactionId),
      ...cachePolicies.transactions,
    }),
  categories: () =>
    queryOptions({
      queryKey: transactionQueryKeys.categories(),
      queryFn: () => categoriesApi.list(),
      ...cachePolicies.categories,
    }),
};
