import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mockApiEndpoints } from "@banking/shared/api-client/endpoints";
import { attachmentsApi } from "@banking/shared/api-client/attachments";
import { transactionsApi } from "@banking/shared/api-client/transactions";
import { server } from "@banking/shared/testing/mocks/server";
import type {
  ApiErrorResponse,
  TransactionAttachment,
} from "@banking/shared/types";
import type { TransactionSubmissionResult } from "../types";
import { useDashboardSummaryQuery } from "@dashboard/features/dashboard/hooks/useDashboard";
import { transactionQueryKeys } from "../api/queryKeys";
import {
  useCreateTransactionMutation,
  useCreateTransactionSubmissionMutation,
  useDeleteTransactionAttachmentMutation,
  useDeleteTransactionMutation,
  useTransactionAttachmentsQuery,
  useTransactionsQuery,
  useUpdateTransactionMutation,
} from "./useTransactions";

interface TestQueryProviderProps {
  children: ReactNode;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function TestQueryProvider({ children }: TestQueryProviderProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

function useTransactionScenario() {
  return {
    transactions: useTransactionsQuery(),
    summary: useDashboardSummaryQuery(),
    createTransaction: useCreateTransactionMutation(),
    updateTransaction: useUpdateTransactionMutation(),
    deleteTransaction: useDeleteTransactionMutation(),
  };
}

function useAttachmentScenario() {
  return {
    attachments: useTransactionAttachmentsQuery("transaction-2", true),
    deleteAttachment: useDeleteTransactionAttachmentMutation(),
  };
}

describe("hooks de transações", () => {
  it("usa chaves centralizadas para listas com filtros", () => {
    expect(transactionQueryKeys.all).toEqual(["transactions"]);
    expect(transactionQueryKeys.lists()).toEqual(["transactions", "list"]);
    expect(transactionQueryKeys.categories()).toEqual([
      "transactions",
      "categories",
    ]);
    expect(transactionQueryKeys.attachmentList("transaction-1")).toEqual([
      "transactions",
      "attachments",
      "transaction-1",
    ]);
    expect(transactionQueryKeys.list({ type: "income", limit: 5 })).toEqual([
      "transactions",
      "list",
      { type: "income", limit: 5 },
    ]);
  });

  it("mantém os dados anteriores enquanto busca outra página", async () => {
    const queryClient = createTestQueryClient();
    const { result, rerender } = renderHook(
      ({ page }: { page: number }) =>
        useTransactionsQuery({ page, pageSize: 5 }),
      {
        initialProps: { page: 1 },
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => {
      expect(result.current.data?.page).toBe(1);
      expect(result.current.data?.items).toHaveLength(5);
    });

    rerender({ page: 2 });

    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data?.page).toBe(1);
    expect(result.current.data?.items).toHaveLength(5);

    await waitFor(() => {
      expect(result.current.isPlaceholderData).toBe(false);
      expect(result.current.data?.page).toBe(2);
      expect(result.current.data?.items).toHaveLength(1);
    });
  });

  it("consulta transações filtradas pelo contrato REST", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () => useTransactionsQuery({ type: "expense", limit: 2 }),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.total).toBe(4);
    expect(
      result.current.data?.items.every(
        (transaction) => transaction.type === "expense",
      ),
    ).toBe(true);
  });

  it("cria, edita e exclui invalidando listas e resumo", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(useTransactionScenario, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.transactions.data?.total).toBe(6);
      expect(result.current.summary.isSuccess).toBe(true);
    });

    await act(async () => {
      await result.current.createTransaction.mutateAsync({
        description: "Nova entrada",
        amount: 350,
        type: "income",
        category: "Transferência",
        date: "2026-07-23",
        status: "completed",
      });
    });

    await waitFor(() => {
      expect(result.current.transactions.data?.total).toBe(7);
      expect(result.current.summary.data?.totalIncome.value).toBe(11050);
    });

    await act(async () => {
      await result.current.updateTransaction.mutateAsync({
        transactionId: "transaction-101",
        transaction: {
          description: "Nova saída",
          amount: 125,
          type: "expense",
          category: "Pagamento",
          date: "2026-07-22",
          status: "completed",
        },
      });
    });

    await waitFor(() => {
      expect(result.current.transactions.data?.items[0]).toMatchObject({
        id: "transaction-101",
        amount: -125,
        formattedAmount: "-R$ 125,00",
      });
      expect(result.current.summary.data?.totalIncome.value).toBe(10700);
      expect(result.current.summary.data?.totalExpense.value).toBe(612.33);
    });

    await act(async () => {
      await result.current.deleteTransaction.mutateAsync("transaction-101");
    });

    await waitFor(() => {
      expect(result.current.transactions.data?.total).toBe(6);
      expect(result.current.summary.data?.totalExpense.value).toBe(487.33);
    });
  });

  it("mantém o cadastro salvo quando somente um upload falha", async () => {
    server.use(
      http.post<
        { transactionId: string },
        never,
        TransactionAttachment | ApiErrorResponse
      >(
        mockApiEndpoints.transactions.attachments,
        async ({ params, request }) => {
          const formData = await request.formData();
          const file = formData.get("file");

          if (!(file instanceof File)) {
            return HttpResponse.json<ApiErrorResponse>(
              {
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Arquivo inválido.",
                },
              },
              { status: 422 },
            );
          }

          if (file.name === "falha.pdf") {
            return HttpResponse.json<ApiErrorResponse>(
              {
                error: {
                  code: "MOCK_ERROR",
                  message: "Falha temporária no upload.",
                },
              },
              { status: 503 },
            );
          }

          return HttpResponse.json<TransactionAttachment>(
            {
              id: "attachment-success",
              transactionId: params.transactionId,
              fileName: file.name,
              contentType: file.type,
              size: file.size,
              formattedSize: "7 bytes",
              uploadedAt: "2026-07-25T12:00:00.000Z",
              downloadUrl: "/api/attachments/attachment-success/content",
            },
            { status: 201 },
          );
        },
      ),
    );
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () => ({
        transactions: useTransactionsQuery(),
        submission: useCreateTransactionSubmissionMutation(),
      }),
      { wrapper: createWrapper(queryClient) },
    );
    const successfulFile = new File(["sucesso"], "sucesso.pdf", {
      type: "application/pdf",
    });
    const failedFile = new File(["falha"], "falha.pdf", {
      type: "application/pdf",
    });

    await waitFor(() => {
      expect(result.current.transactions.data?.total).toBe(6);
    });

    let submissionResult: TransactionSubmissionResult | null = null;
    await act(async () => {
      submissionResult = await result.current.submission.mutateAsync({
        transaction: {
          description: "Transação com anexos",
          amount: 90,
          type: "expense",
          category: "Pagamento",
          date: "2026-07-25",
          status: "completed",
          observation: "Teste de erro parcial",
        },
        attachments: [successfulFile, failedFile],
        persistedTransaction: null,
      });
    });

    expect(submissionResult).toMatchObject({
      uploadedAttachments: [{ fileName: "sucesso.pdf" }],
      failedAttachments: [
        {
          file: failedFile,
          message: "Falha temporária no upload.",
        },
      ],
    });
    await waitFor(() => {
      expect(result.current.transactions.data?.total).toBe(7);
    });
  });

  it("persiste o anexo, mantém o contador ao editar e o devolve ao reabrir", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(useCreateTransactionSubmissionMutation, {
      wrapper: createWrapper(queryClient),
    });
    const file = new File(["comprovante"], "comprovante-novo.pdf", {
      type: "application/pdf",
    });

    let submissionResult: TransactionSubmissionResult | null = null;
    await act(async () => {
      submissionResult = await result.current.mutateAsync({
        transaction: {
          description: "Transação persistida com anexo",
          amount: 140,
          type: "expense",
          category: "Pagamento",
          date: "2026-07-25",
          status: "completed",
          observation: "Validação da persistência",
        },
        attachments: [file],
        persistedTransaction: null,
      });
    });

    expect(submissionResult).not.toBeNull();
    const transactionId = submissionResult!.transaction.id;
    expect(submissionResult!.failedAttachments).toHaveLength(0);

    await expect(attachmentsApi.list(transactionId)).resolves.toMatchObject({
      items: [
        {
          transactionId,
          fileName: "comprovante-novo.pdf",
        },
      ],
    });

    await transactionsApi.update(transactionId, {
      ...submissionResult!.transaction.editableFields,
      description: "Transação editada com anexo",
    });

    const persistedList = await transactionsApi.list();
    expect(
      persistedList.items.find((transaction) => transaction.id === transactionId),
    ).toMatchObject({
      description: "Transação editada com anexo",
      attachmentCount: 1,
    });
  });

  it("remove anexo existente e invalida a lista afetada", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(useAttachmentScenario, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.attachments.data?.items).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteAttachment.mutateAsync({
        transactionId: "transaction-2",
        attachmentId: "attachment-1",
      });
    });

    await waitFor(() => {
      expect(result.current.attachments.data?.items).toHaveLength(0);
    });
  });
});
