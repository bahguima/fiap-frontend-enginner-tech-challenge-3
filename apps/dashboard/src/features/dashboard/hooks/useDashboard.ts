"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "../api/queryOptions";

export function useDashboardHomeQuery() {
  return useQuery(dashboardQueries.home());
}

export function useDashboardSummaryQuery() {
  return useQuery(dashboardQueries.summary());
}

export function useDashboardMonthlyQuery() {
  return useQuery(dashboardQueries.monthly());
}

export function useProfileQuery() {
  return useQuery(dashboardQueries.profile());
}
