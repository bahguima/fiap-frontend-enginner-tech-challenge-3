import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import {
  createTransactionUseCases,
  type TransactionUseCases,
} from "@banking/shared/application";
import type { TransactionsRepository } from "@banking/shared/domain";
import { mockApiEndpoints } from "@banking/shared/api-client/endpoints";
import { server } from "@banking/shared/testing/mocks/server";
import type {
  ApiErrorResponse,
  CreateTransactionRequest,
  TransactionListResponse,
} from "@banking/shared/types";
import { TransactionUseCasesProvider } from "../di/TransactionUseCasesProvider";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useTransactionsQuery,
  useUpdateTransactionMutation,
} from "./useTransactions";

interface Gate {
  promise: Promise<void>;
  open: () => void;
}

function createGate(): Gate {
  let open = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(
  queryClient: QueryClient,
  useCases?: TransactionUseCases,
) {
  return function TestProviders({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TransactionUseCasesProvider useCases={useCases}>
          {children}
        </TransactionUseCasesProvider>
      </QueryClientProvider>
    );
  };
}

const failure = HttpResponse.json<ApiErrorResponse>(
  { error: { code: "MOCK_ERROR", message: "Serviço indisponível." } },
  { status: 503 },
);

/**
 * Segura o próximo GET da lista (a revalidação disparada por `onSettled`) até
 * que o teste libere. Assim provamos que o estado restaurado veio do rollback
 * em `onError`, e não de uma nova busca na API. Ao retornar `undefined`, o
 * MSW repassa a requisição ao handler padrão.
 */
function holdListRefetch(): Gate {
  const gate = createGate();
  server.use(
    http.get(mockApiEndpoints.transactions.list, async () => {
      await gate.promise;
    }),
  );
  return gate;
}

const newTransaction: CreateTransactionRequest = {
  description: "Compra otimista",
  amount: 42,
  type: "expense",
  category: "Pagamento",
  date: "2026-07-24",
  status: "completed",
};

function useScenario() {
  return {
    transactions: useTransactionsQuery(),
    create: useCreateTransactionMutation(),
    update: useUpdateTransactionMutation(),
    remove: useDeleteTransactionMutation(),
  };
}

async function renderLoadedScenario() {
  const queryClient = createTestQueryClient();
  const hook = renderHook(useScenario, {
    wrapper: createWrapper(queryClient),
  });

  await waitFor(() => {
    expect(hook.result.current.transactions.data?.total).toBe(6);
  });

  return {
    ...hook,
    snapshot: hook.result.current.transactions.data as TransactionListResponse,
  };
}

describe("atualização otimista de transações", () => {
  it("exibe a nova transação antes da resposta e a substitui pelo dado da API", async () => {
    const responseGate = createGate();
    server.use(
      http.post(mockApiEndpoints.transactions.list, async () => {
        await responseGate.promise;
      }),
    );
    const { result } = await renderLoadedScenario();

    act(() => {
      result.current.create.mutate(newTransaction);
    });

    await waitFor(() => {
      expect(result.current.transactions.data?.total).toBe(7);
    });
    expect(result.current.transactions.data?.items[0]).toMatchObject({
      id: expect.stringMatching(/^optimistic-transaction-/),
      description: "Compra otimista",
      formattedAmount: "-R$ 42,00",
    });

    responseGate.open();

    await waitFor(() => {
      expect(result.current.create.isSuccess).toBe(true);
    });
    expect(result.current.transactions.data?.items[0]).toMatchObject({
      id: "transaction-101",
      description: "Compra otimista",
    });
  });

  it("desfaz a criação otimista quando a API falha", async () => {
    const responseGate = createGate();
    server.use(
      http.post(mockApiEndpoints.transactions.list, async () => {
        await responseGate.promise;
        return failure.clone();
      }),
    );
    const { result, snapshot } = await renderLoadedScenario();
    const refetchGate = holdListRefetch();

    act(() => {
      result.current.create.mutate(newTransaction);
    });

    await waitFor(() => {
      expect(result.current.transactions.data?.total).toBe(7);
    });

    responseGate.open();

    await waitFor(() => {
      expect(result.current.transactions.data).toEqual(snapshot);
    });
    expect(result.current.create.isPending).toBe(true);

    refetchGate.open();

    await waitFor(() => {
      expect(result.current.create.isError).toBe(true);
    });
    expect(result.current.create.error?.message).toBe("Serviço indisponível.");
    expect(result.current.transactions.data?.total).toBe(6);
  });

  it("desfaz a edição otimista quando a API falha", async () => {
    const responseGate = createGate();
    server.use(
      http.put(mockApiEndpoints.transactions.detail, async () => {
        await responseGate.promise;
        return failure.clone();
      }),
    );
    const { result, snapshot } = await renderLoadedScenario();
    const original = snapshot.items.find((item) => item.id === "transaction-2");
    expect(original).toBeDefined();
    const refetchGate = holdListRefetch();

    act(() => {
      result.current.update.mutate({
        transactionId: "transaction-2",
        transaction: {
          ...original!.editableFields,
          description: "Streaming editado",
          amount: 99.9,
        },
      });
    });

    await waitFor(() => {
      expect(
        result.current.transactions.data?.items.find(
          (item) => item.id === "transaction-2",
        ),
      ).toMatchObject({
        description: "Streaming editado",
        amount: -99.9,
        attachmentCount: original!.attachmentCount,
      });
    });

    responseGate.open();

    await waitFor(() => {
      expect(result.current.transactions.data).toEqual(snapshot);
    });
    expect(result.current.update.isPending).toBe(true);

    refetchGate.open();

    await waitFor(() => {
      expect(result.current.update.isError).toBe(true);
    });
  });

  it("desfaz a exclusão otimista quando a API falha", async () => {
    const responseGate = createGate();
    server.use(
      http.delete(mockApiEndpoints.transactions.detail, async () => {
        await responseGate.promise;
        return failure.clone();
      }),
    );
    const { result, snapshot } = await renderLoadedScenario();
    const refetchGate = holdListRefetch();

    act(() => {
      result.current.remove.mutate("transaction-2");
    });

    await waitFor(() => {
      expect(result.current.transactions.data?.total).toBe(5);
    });
    expect(
      result.current.transactions.data?.items.some(
        (item) => item.id === "transaction-2",
      ),
    ).toBe(false);

    responseGate.open();

    await waitFor(() => {
      expect(result.current.transactions.data).toEqual(snapshot);
    });
    expect(result.current.remove.isPending).toBe(true);

    refetchGate.open();

    await waitFor(() => {
      expect(result.current.remove.isError).toBe(true);
    });
  });

  it("consome os casos de uso injetados pelo provider", async () => {
    const list = jest.fn<
      ReturnType<TransactionsRepository["list"]>,
      Parameters<TransactionsRepository["list"]>
    >(async () => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      firstPage: 1,
      previousPage: null,
      nextPage: null,
      lastPage: 1,
      resultsLabel: "Nenhuma transação",
    }));
    const repository: TransactionsRepository = {
      list,
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const queryClient = createTestQueryClient();

    const { result } = renderHook(
      () => useTransactionsQuery({ type: "income" }),
      {
        wrapper: createWrapper(
          queryClient,
          createTransactionUseCases(repository),
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.data?.resultsLabel).toBe("Nenhuma transação");
    });
    expect(list).toHaveBeenCalledWith(
      { type: "income" },
      { signal: expect.objectContaining({ aborted: false }) },
    );
  });
});
