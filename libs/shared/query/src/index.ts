import { QueryClient, type DefaultOptions } from "@tanstack/react-query";
import { cachePolicies } from "./cachePolicies";
import { queryRetryDelay, shouldRetryQuery } from "./retry";

export * from "./cachePolicies";
export * from "./retry";
export * from "./persistence";

export interface CreateQueryClientOptions {
  /** Sobrescreve os padrões (ex.: `retry: false` em testes de erro). */
  queries?: DefaultOptions["queries"];
  mutations?: DefaultOptions["mutations"];
}

/**
 * Cria o QueryClient único da composição (shell) ou dos modos standalone.
 *
 * Os padrões globais usam a política mais conservadora (`transactions`);
 * cada domínio aplica a sua via `cachePolicies` nas `queryOptions`.
 */
export const createQueryClient = (options: CreateQueryClientOptions = {}) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: cachePolicies.transactions.staleTime,
        gcTime: cachePolicies.transactions.gcTime,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        retryDelay: queryRetryDelay,
        ...options.queries,
      },
      mutations: {
        // Mutações não são idempotentes: nunca repetir automaticamente.
        retry: false,
        ...options.mutations,
      },
    },
  });
