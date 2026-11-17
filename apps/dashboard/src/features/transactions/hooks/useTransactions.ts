"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addTransactionToList,
  createOptimisticTransaction,
  removeTransactionFromList,
  replaceTransactionInList,
} from "@banking/shared/application";
import type {
  CreateTransactionRequest,
  TransactionAttachment,
  TransactionEditableFields,
  TransactionListFilters,
  UpdateTransactionRequest,
  TransactionViewModel,
} from "@banking/shared/types";
import { attachmentsApi } from "@banking/shared/api-client";
import { transactionQueryKeys } from "../api/queryKeys";
import { transactionQueries } from "../api/queryOptions";
import { useTransactionUseCases } from "../di/TransactionUseCasesProvider";
import type { AttachmentUploadFailure, TransactionSubmissionResult } from "../types";
import {
  createOptimisticTransactionId,
  useOptimisticTransactionLists,
  type OptimisticTransactionContext,
  type TransactionListUpdater,
} from "./useOptimisticTransactionLists";

export type { AttachmentUploadFailure, TransactionSubmissionResult } from "../types";

export interface UpdateTransactionVariables {
  transactionId: string;
  transaction: UpdateTransactionRequest;
}

export interface CreateTransactionSubmissionVariables {
  transaction: TransactionEditableFields;
  attachments: File[];
  persistedTransaction: TransactionViewModel | null;
}

export interface UpdateTransactionSubmissionVariables {
  transactionId: string;
  transaction: TransactionEditableFields;
  attachments: File[];
  persistedTransaction: TransactionViewModel | null;
}

export interface DeleteTransactionAttachmentVariables {
  transactionId: string;
  attachmentId: string;
}

/** Contexto vazio usado quando não há atualização otimista a desfazer. */
const NO_OPTIMISTIC_UPDATE: OptimisticTransactionContext = { previousLists: [] };

export function useTransactionsQuery(
  filters: TransactionListFilters = {},
) {
  const { listTransactions } = useTransactionUseCases();

  return useQuery({
    ...transactionQueries.list(listTransactions, filters),
    placeholderData: keepPreviousData,
  });
}

export function useTransactionCategoriesQuery() {
  return useQuery(transactionQueries.categories());
}

export function useTransactionAttachmentsQuery(
  transactionId: string | null,
  enabled: boolean,
) {
  return useQuery({
    ...transactionQueries.attachments(transactionId ?? ""),
    enabled: enabled && transactionId !== null,
  });
}

export function useCreateTransactionMutation() {
  const { createTransaction } = useTransactionUseCases();
  const optimistic = useOptimisticTransactionLists();

  return useMutation<
    TransactionViewModel,
    Error,
    CreateTransactionRequest,
    OptimisticTransactionContext
  >({
    mutationFn: (transaction) => createTransaction.execute(transaction),
    onMutate: (transaction) =>
      optimistic.apply(createListInsertion(transaction, 0)),
    onError: (_error, _variables, context) => optimistic.rollback(context),
    onSettled: optimistic.settle,
  });
}

export function useUpdateTransactionMutation() {
  const { updateTransaction } = useTransactionUseCases();
  const optimistic = useOptimisticTransactionLists();

  return useMutation<
    TransactionViewModel,
    Error,
    UpdateTransactionVariables,
    OptimisticTransactionContext
  >({
    mutationFn: (variables) => updateTransaction.execute(variables),
    onMutate: ({ transactionId, transaction }) =>
      optimistic.apply(createListReplacement(transactionId, transaction)),
    onError: (_error, _variables, context) => optimistic.rollback(context),
    onSettled: optimistic.settle,
  });
}

export function useDeleteTransactionMutation() {
  const { deleteTransaction } = useTransactionUseCases();
  const optimistic = useOptimisticTransactionLists();

  return useMutation<void, Error, string, OptimisticTransactionContext>({
    mutationFn: (transactionId) => deleteTransaction.execute(transactionId),
    onMutate: (transactionId) =>
      optimistic.apply((list) => removeTransactionFromList(list, transactionId)),
    onError: (_error, _variables, context) => optimistic.rollback(context),
    onSettled: optimistic.settle,
  });
}

export function useCreateTransactionSubmissionMutation() {
  const { createTransaction } = useTransactionUseCases();
  const optimistic = useOptimisticTransactionLists();

  return useMutation<
    TransactionSubmissionResult,
    Error,
    CreateTransactionSubmissionVariables,
    OptimisticTransactionContext
  >({
    mutationFn: async ({ transaction, attachments, persistedTransaction }) => {
      const savedTransaction =
        persistedTransaction ?? (await createTransaction.execute(transaction));

      return uploadTransactionAttachments(savedTransaction, attachments);
    },
    // Uma nova tentativa de upload não recria a transação já persistida.
    onMutate: ({ transaction, attachments, persistedTransaction }) =>
      persistedTransaction
        ? NO_OPTIMISTIC_UPDATE
        : optimistic.apply(createListInsertion(transaction, attachments.length)),
    onError: (_error, _variables, context) => optimistic.rollback(context),
    onSettled: optimistic.settle,
  });
}

export function useUpdateTransactionSubmissionMutation() {
  const { updateTransaction } = useTransactionUseCases();
  const optimistic = useOptimisticTransactionLists();

  return useMutation<
    TransactionSubmissionResult,
    Error,
    UpdateTransactionSubmissionVariables,
    OptimisticTransactionContext
  >({
    mutationFn: async ({
      transactionId,
      transaction,
      attachments,
      persistedTransaction,
    }) => {
      const savedTransaction =
        persistedTransaction ??
        (await updateTransaction.execute({ transactionId, transaction }));

      return uploadTransactionAttachments(savedTransaction, attachments);
    },
    onMutate: ({ transactionId, transaction, persistedTransaction }) =>
      persistedTransaction
        ? NO_OPTIMISTIC_UPDATE
        : optimistic.apply(createListReplacement(transactionId, transaction)),
    onError: (_error, _variables, context) => optimistic.rollback(context),
    onSettled: optimistic.settle,
  });
}

export function useDeleteTransactionAttachmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attachmentId,
    }: DeleteTransactionAttachmentVariables) =>
      attachmentsApi.remove(attachmentId),
    onSuccess: (_response, variables) =>
      queryClient.invalidateQueries({
        queryKey: transactionQueryKeys.attachmentList(
          variables.transactionId,
        ),
      }),
  });
}

function createListInsertion(
  transaction: CreateTransactionRequest,
  attachmentCount: number,
): TransactionListUpdater {
  const optimisticTransaction = createOptimisticTransaction(transaction, {
    id: createOptimisticTransactionId(),
    attachmentCount,
  });

  return (list, filters) =>
    optimisticTransaction
      ? addTransactionToList(list, filters, optimisticTransaction)
      : list;
}

function createListReplacement(
  transactionId: string,
  transaction: UpdateTransactionRequest,
): TransactionListUpdater {
  return (list) => {
    const currentTransaction = list.items.find(
      (item) => item.id === transactionId,
    );
    if (!currentTransaction) return list;

    const optimisticTransaction = createOptimisticTransaction(transaction, {
      id: transactionId,
      attachmentCount: currentTransaction.attachmentCount,
    });

    return optimisticTransaction
      ? replaceTransactionInList(list, optimisticTransaction)
      : list;
  };
}

async function uploadTransactionAttachments(
  transaction: TransactionViewModel,
  attachments: File[],
): Promise<TransactionSubmissionResult> {
  const uploadedAttachments: TransactionAttachment[] = [];
  const failedAttachments: AttachmentUploadFailure[] = [];

  for (const file of attachments) {
    try {
      const attachment = await attachmentsApi.create(transaction.id, {
        file,
      });
      uploadedAttachments.push(attachment);
    } catch (error) {
      failedAttachments.push({
        file,
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar este arquivo.",
      });
    }
  }

  return {
    transaction,
    uploadedAttachments,
    failedAttachments,
  };
}
