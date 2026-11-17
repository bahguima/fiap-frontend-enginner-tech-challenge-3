import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { cachePolicies, createQueryClient } from "@banking/shared/query";
import { categoriesApi } from "@banking/shared/api-client/categories";
import { dashboardQueries } from "../../dashboard/api/queryOptions";
import { useTransactionCategoriesQuery } from "../hooks/useTransactions";
import { transactionQueries } from "./queryOptions";

describe("política de cache aplicada às queries do dashboard", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("usa a política de cada domínio nas queryOptions", () => {
    expect(transactionQueries.categories()).toMatchObject(cachePolicies.categories);
    expect(transactionQueries.attachments("tx-1")).toMatchObject(
      cachePolicies.transactions,
    );
    expect(dashboardQueries.summary()).toMatchObject(cachePolicies.dashboard);
    expect(dashboardQueries.profile()).toMatchObject(cachePolicies.dashboard);
  });

  it("não refaz a busca de categorias ao remontar dentro do staleTime", async () => {
    const listSpy = jest.spyOn(categoriesApi, "list");
    const queryClient = createQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const first = renderHook(() => useTransactionCategoriesQuery(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const second = renderHook(() => useTransactionCategoriesQuery(), { wrapper });

    expect(second.result.current.isSuccess).toBe(true);
    expect(second.result.current.isFetching).toBe(false);
    expect(listSpy).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
