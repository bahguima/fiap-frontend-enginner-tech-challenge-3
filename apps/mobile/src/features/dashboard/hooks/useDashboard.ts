import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useAuth } from "@mobile/providers/AuthContext";
import { dashboardQueryKeys } from "@mobile/services/query/queryKeys";
import { requireAuthenticatedUid } from "@mobile/features/transactions/data";
import { getFirebaseDashboardRepository } from "../data/FirebaseDashboardRepository";
import {
  createDashboardPeriod,
  selectCategoryDistribution,
  selectDashboardIndicators,
  selectMonthlyEvolution,
} from "../data/selectors";
import type { DashboardPeriod, DashboardRepository } from "../types";

interface DashboardQueryOptions {
  enabled?: boolean;
  period?: DashboardPeriod;
  repository?: DashboardRepository;
}

export function useDashboard(options: DashboardQueryOptions = {}) {
  const { session } = useAuth();
  const uid = session?.uid ?? "";
  const period = useMemo(() => options.period ?? createDashboardPeriod(), [options.period]);
  const repository = options.repository ?? getFirebaseDashboardRepository();
  const enabled = Boolean(uid) && (options.enabled ?? true);

  const summary = useQuery({
    queryKey: dashboardQueryKeys.summary(uid, period.key),
    queryFn: () => repository.getSummary(requireAuthenticatedUid(uid, "list"), period),
    select: selectDashboardIndicators,
    enabled,
  });
  const monthly = useQuery({
    queryKey: dashboardQueryKeys.monthly(uid, period.key),
    queryFn: () => repository.getMonthlyEvolution(requireAuthenticatedUid(uid, "list"), period.months),
    select: selectMonthlyEvolution,
    enabled,
  });
  const categories = useQuery({
    queryKey: dashboardQueryKeys.categories(uid, period.key),
    queryFn: () => repository.getCategoryDistribution(requireAuthenticatedUid(uid, "list"), period),
    select: selectCategoryDistribution,
    enabled,
  });
  const recent = useQuery({
    queryKey: dashboardQueryKeys.recent(uid),
    queryFn: () => repository.getRecentTransactions(requireAuthenticatedUid(uid, "list"), 5),
    enabled,
  });

  const refetch = useCallback(
    () => Promise.all([summary.refetch(), monthly.refetch(), categories.refetch(), recent.refetch()]),
    [categories, monthly, recent, summary],
  );

  return {
    period,
    summary,
    monthly,
    categories,
    recent,
    isPending: summary.isPending || monthly.isPending || categories.isPending || recent.isPending,
    isError: summary.isError || monthly.isError || categories.isError || recent.isError,
    isRefetching:
      summary.isRefetching || monthly.isRefetching || categories.isRefetching || recent.isRefetching,
    refetch,
  };
}
