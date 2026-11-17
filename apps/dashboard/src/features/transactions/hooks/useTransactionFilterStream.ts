"use client";

import { useSearchStream } from "@banking/shared/reactive";
import type { TransactionListFilters } from "@banking/shared/types";

import { createTransactionSearchParams } from "./useTransactionListSearchParams";

/** Janela de estabilização da busca/filtros do extrato enquanto o usuário digita. */
export const TRANSACTION_FILTERS_DEBOUNCE_MS = 400;

const areSameFilters = (
  previous: TransactionListFilters,
  current: TransactionListFilters,
) =>
  createTransactionSearchParams(previous) ===
  createTransactionSearchParams(current);

/**
 * Passa os valores brutos do formulário de filtros por um stream reativo
 * (debounce → distinctUntilChanged → switchMap) e entrega apenas os filtros
 * estabilizados a `onStableFilters` (normalmente, atualizar a URL).
 *
 * O stream não guarda dados de servidor: a URL vira a query key e o TanStack
 * Query continua dono do cache e do cancelamento da requisição HTTP obsoleta.
 */
export function useTransactionFilterStream(
  onStableFilters: (filters: TransactionListFilters) => void,
) {
  return useSearchStream<TransactionListFilters, TransactionListFilters>({
    debounceMs: TRANSACTION_FILTERS_DEBOUNCE_MS,
    isEqual: areSameFilters,
    execute: (filters) => filters,
    onResult: onStableFilters,
  });
}
