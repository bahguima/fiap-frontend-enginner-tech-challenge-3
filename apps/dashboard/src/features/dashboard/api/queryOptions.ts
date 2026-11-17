import { queryOptions } from "@tanstack/react-query";
import { cachePolicies } from "@banking/shared/query";
import { dashboardApi, profileApi } from "@banking/shared/api-client";
import { dashboardQueryKeys } from "./queryKeys";

/**
 * Opções de consulta do domínio de dashboard.
 *
 * Compartilhadas entre os hooks (`useQuery`) e o prefetch em intenção do
 * usuário (`queryClient.prefetchQuery`), garantindo a mesma key, o mesmo
 * `queryFn` e a mesma política de cache (`cachePolicies.dashboard`) nos dois
 * caminhos.
 */
export const dashboardQueries = {
  home: () =>
    queryOptions({
      queryKey: dashboardQueryKeys.home(),
      queryFn: ({ signal }) => dashboardApi.getHome(signal),
      ...cachePolicies.dashboard,
    }),
  summary: () =>
    queryOptions({
      queryKey: dashboardQueryKeys.summary(),
      queryFn: ({ signal }) => dashboardApi.getSummary(signal),
      ...cachePolicies.dashboard,
    }),
  monthly: () =>
    queryOptions({
      queryKey: dashboardQueryKeys.monthly(),
      queryFn: ({ signal }) => dashboardApi.getMonthly(signal),
      ...cachePolicies.dashboard,
    }),
  profile: () =>
    queryOptions({
      queryKey: dashboardQueryKeys.profile(),
      queryFn: ({ signal }) => profileApi.get(signal),
      ...cachePolicies.dashboard,
    }),
};
