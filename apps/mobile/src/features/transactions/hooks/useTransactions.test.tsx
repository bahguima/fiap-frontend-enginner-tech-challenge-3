import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import {
  dashboardQueryKeys,
  transactionAttachmentQueryKeys,
  transactionQueryKeys,
} from "@mobile/services/query/queryKeys";
import type {
  TransactionCursor,
  TransactionInput,
  TransactionsRepository,
} from "../types/transactions";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useTransactionsInfiniteQuery,
  useUpdateTransactionMutation,
} from "./useTransactions";

jest.mock("@mobile/providers/AuthContext", () => ({
  useAuth: () => ({ session: { uid: "uid-1" } }),
}));

jest.mock("../data", () => {
  const errors = jest.requireActual("../data/transactionErrors");

  return {
    getFirebaseTransactionsRepository: jest.fn(),
    requireAuthenticatedUid: errors.requireAuthenticatedUid,
  };
});

const input: TransactionInput = {
  description: "Supermercado",
  observation: "",
  amountInCents: 15_000,
  type: "expense",
  categoryId: "groceries",
  category: "Alimentação",
  date: "2026-09-10",
  status: "completed",
};

const transaction = { id: "tx-1", ...input, attachmentCount: 0 };
const testQueryClients: QueryClient[] = [];

afterEach(() => {
  testQueryClients.forEach((queryClient) => queryClient.clear());
  testQueryClients.length = 0;
});

function createRepository(): jest.Mocked<TransactionsRepository> {
  return {
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
    listCategories: jest.fn(),
  };
}

function createTestContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
  testQueryClients.push(queryClient);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe("transaction hooks", () => {
  it("uses the next cursor returned by the repository", async () => {
    const repository = createRepository();
    const cursor: TransactionCursor = {
      orderValue: "2026-09-10",
      createdAtMillis: 1_789_000_000_000,
      id: "tx-1",
    };
    repository.list
      .mockResolvedValueOnce({ items: [transaction], nextCursor: cursor })
      .mockResolvedValueOnce({ items: [] });
    const { wrapper } = createTestContext();
    const { result } = renderHook(
      () => useTransactionsInfiniteQuery({}, { repository }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(repository.list).toHaveBeenNthCalledWith(1, "uid-1", {}, undefined);
    expect(repository.list).toHaveBeenNthCalledWith(2, "uid-1", {}, cursor);
  });

  it("updates dependent caches after creation", async () => {
    const repository = createRepository();
    repository.create.mockResolvedValue(transaction);
    const { queryClient, wrapper } = createTestContext();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useCreateTransactionMutation({ repository }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync(input);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData(transactionQueryKeys.detail("uid-1", "tx-1")),
    ).toEqual(transaction);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: transactionQueryKeys.lists("uid-1"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all("uid-1"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: transactionAttachmentQueryKeys.byTransaction(
        "uid-1",
        "tx-1",
      ),
    });
  });

  it("updates dependent caches after an update", async () => {
    const repository = createRepository();
    repository.update.mockResolvedValue(transaction);
    const { queryClient, wrapper } = createTestContext();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useUpdateTransactionMutation({ repository }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ id: "tx-1", input });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData(transactionQueryKeys.detail("uid-1", "tx-1")),
    ).toEqual(transaction);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: transactionQueryKeys.lists("uid-1"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all("uid-1"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: transactionAttachmentQueryKeys.byTransaction(
        "uid-1",
        "tx-1",
      ),
    });
  });

  it("exposes a persistence error without updating the cache", async () => {
    const repository = createRepository();
    const persistenceError = new Error("Serviço indisponível.");
    repository.create.mockRejectedValue(persistenceError);
    const { queryClient, wrapper } = createTestContext();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useCreateTransactionMutation({ repository }),
      { wrapper },
    );

    await act(async () => {
      await expect(result.current.mutateAsync(input)).rejects.toBe(
        persistenceError,
      );
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(persistenceError);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("removes related detail and attachments after deletion", async () => {
    const repository = createRepository();
    repository.delete.mockResolvedValue();
    const { queryClient, wrapper } = createTestContext();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    queryClient.setQueryData(
      transactionQueryKeys.detail("uid-1", "tx-1"),
      transaction,
    );
    queryClient.setQueryData(
      transactionAttachmentQueryKeys.byTransaction("uid-1", "tx-1"),
      [{ id: "attachment-1" }],
    );
    const { result } = renderHook(
      () => useDeleteTransactionMutation({ repository }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync("tx-1");
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData(transactionQueryKeys.detail("uid-1", "tx-1")),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(
        transactionAttachmentQueryKeys.byTransaction("uid-1", "tx-1"),
      ),
    ).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: transactionQueryKeys.lists("uid-1"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all("uid-1"),
    });
  });
});
