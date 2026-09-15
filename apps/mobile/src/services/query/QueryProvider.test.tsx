import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { TransactionsRepositoryError } from "@mobile/features/transactions/data/transactionErrors";
import { AuthProvider } from "@mobile/providers/AuthContext";
import { createTestAuthAdapter, testSession } from "@mobile/test/auth";
import { AuthenticatedQueryCacheBoundary, shouldRetryQuery } from "./QueryProvider";
import { mobileUserQueryKeys, transactionQueryKeys } from "./queryKeys";

describe("mobile query lifecycle", () => {
  it("retries only transient query failures up to two times", () => {
    expect(
      shouldRetryQuery(
        0,
        new TransactionsRepositoryError("unavailable", "list"),
      ),
    ).toBe(true);
    expect(
      shouldRetryQuery(
        0,
        new TransactionsRepositoryError("permission-denied", "list"),
      ),
    ).toBe(false);
    expect(shouldRetryQuery(0, { code: "firestore/invalid-argument" })).toBe(
      false,
    );
    expect(shouldRetryQuery(2, new Error("network"))).toBe(false);
  });

  it("removes every user-scoped cache entry after logout", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const adapter = createTestAuthAdapter(testSession);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider adapter={adapter}>
          <AuthenticatedQueryCacheBoundary>
            <Text>Conteúdo autenticado</Text>
          </AuthenticatedQueryCacheBoundary>
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(queryClient.getQueryCache().findAll()).toHaveLength(0),
    );
    queryClient.setQueryData(
      transactionQueryKeys.detail(testSession.uid, "tx-1"),
      { id: "tx-1" },
    );
    expect(
      queryClient.getQueriesData({
        queryKey: mobileUserQueryKeys.all(testSession.uid),
      }),
    ).toHaveLength(1);

    act(() => adapter.emitSession(null));

    await waitFor(() =>
      expect(
        queryClient.getQueriesData({
          queryKey: mobileUserQueryKeys.all(testSession.uid),
        }),
      ).toHaveLength(0),
    );
    queryClient.clear();
  });
});
