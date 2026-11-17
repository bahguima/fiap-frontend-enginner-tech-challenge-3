"use client";

import { useCallback } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { dashboardQueries } from "@dashboard/features/dashboard/api/queryOptions";
import { transactionQueries } from "@dashboard/features/transactions/api/queryOptions";
import { useTransactionUseCases } from "@dashboard/features/transactions/di/TransactionUseCasesProvider";
import { readTransactionSearchParams } from "@dashboard/features/transactions/hooks/useTransactionListSearchParams";
import {
  dashboardPages,
  resolveDashboardRoute,
  type DashboardRoutePath,
} from "./dashboardRoutes";

/**
 * Janela em que um dado pré-carregado é considerado fresco o bastante para
 * não ser buscado de novo a cada hover. Não altera o `staleTime` das páginas.
 */
export const ROUTE_PREFETCH_STALE_TIME = 30 * 1000;

type ListTransactions = Parameters<typeof transactionQueries.list>[0];

/**
 * Pré-carrega o chunk da página e os dados que ela consulta ao montar.
 *
 * Usado em intenção do usuário (hover/foco nos links da sidebar). As consultas
 * usam as mesmas fábricas de opções dos hooks, então a página encontra o
 * cache preenchido e renderiza sem o estado de carregamento.
 */
export function usePrefetchDashboardRoute() {
  const queryClient = useQueryClient();
  const { listTransactions } = useTransactionUseCases();

  return useCallback(
    (pathname: string) => {
      const route = resolveDashboardRoute(pathname);

      void dashboardPages[route].preload().catch(() => {
        // A falha reaparece (com nova tentativa) quando a rota for renderizada.
      });

      void Promise.all(
        prefetchRouteQueries(route, queryClient, listTransactions),
      );
    },
    [listTransactions, queryClient],
  );
}

function withPrefetchStaleTime<TOptions extends { staleTime?: unknown }>(
  options: TOptions,
): TOptions {
  const ownStaleTime =
    typeof options.staleTime === "number" ? options.staleTime : 0;

  return {
    ...options,
    staleTime: Math.max(ROUTE_PREFETCH_STALE_TIME, ownStaleTime),
  };
}

function prefetchRouteQueries(
  route: DashboardRoutePath,
  queryClient: QueryClient,
  listTransactions: ListTransactions,
): Promise<void>[] {
  const summary = () =>
    queryClient.prefetchQuery(withPrefetchStaleTime(dashboardQueries.summary()));
  const monthly = () =>
    queryClient.prefetchQuery(withPrefetchStaleTime(dashboardQueries.monthly()));
  const transactions = (
    filters: Parameters<typeof transactionQueries.list>[1],
  ) =>
    queryClient.prefetchQuery(
      withPrefetchStaleTime(transactionQueries.list(listTransactions, filters)),
    );

  switch (route) {
    case "/dashboard":
      return [
        queryClient.prefetchQuery(withPrefetchStaleTime(dashboardQueries.home())),
      ];
    case "/dashboard/statement":
      // O link da sidebar não carrega filtros: mesma key que a página usa ao
      // abrir sem query string.
      return [
        transactions(readTransactionSearchParams("")),
        queryClient.prefetchQuery(
          withPrefetchStaleTime(transactionQueries.categories()),
        ),
      ];
    case "/dashboard/income":
      return [transactions({ type: "income" }), summary(), monthly()];
    case "/dashboard/expenses":
      return [transactions({ type: "expense" }), summary(), monthly()];
    case "/dashboard/profile":
      return [
        queryClient.prefetchQuery(
          withPrefetchStaleTime(dashboardQueries.profile()),
        ),
      ];
  }
}
