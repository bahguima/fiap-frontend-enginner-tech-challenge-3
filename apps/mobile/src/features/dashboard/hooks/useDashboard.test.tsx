import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { createDashboardPeriod } from "../data/selectors";
import type { DashboardRepository } from "../types";
import { useDashboard } from "./useDashboard";

jest.mock("@mobile/providers/AuthContext", () => ({
  useAuth: () => ({ session: { uid: "uid-dashboard" } }),
}));

function repository(): jest.Mocked<DashboardRepository> {
  return {
    getSummary: jest.fn().mockResolvedValue({
      balanceInCents: 100_000,
      current: { transactionCount: 1, incomeInCents: 100_000, expenseInCents: 0 },
      previous: { transactionCount: 0, incomeInCents: 0, expenseInCents: 0 },
    }),
    getMonthlyEvolution: jest.fn().mockResolvedValue([]),
    getCategoryDistribution: jest.fn().mockResolvedValue([]),
    getRecentTransactions: jest.fn().mockResolvedValue([]),
  };
}

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useDashboard", () => {
  it("runs independent summary, monthly, category and recent queries", async () => {
    const dataSource = repository();
    const period = createDashboardPeriod(new Date(2026, 8, 14));
    const { result } = renderHook(() => useDashboard({ period, repository: dataSource }), {
      wrapper: wrapper(),
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(dataSource.getSummary).toHaveBeenCalledWith("uid-dashboard", period);
    expect(dataSource.getMonthlyEvolution).toHaveBeenCalledWith("uid-dashboard", period.months);
    expect(dataSource.getCategoryDistribution).toHaveBeenCalledWith("uid-dashboard", period);
    expect(dataSource.getRecentTransactions).toHaveBeenCalledWith("uid-dashboard", 5);
    expect(result.current.summary.data?.balance.formattedValue).toBe("R$ 1.000,00");
  });

  it("exposes an error when one indicator query fails", async () => {
    const dataSource = repository();
    dataSource.getMonthlyEvolution.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useDashboard({ repository: dataSource }), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.monthly.isError).toBe(true);
  });
});
