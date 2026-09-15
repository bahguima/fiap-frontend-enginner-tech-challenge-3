"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateTransactionRequest,
  TransactionAttachment,
  TransactionEditableFields,
  TransactionListFilters,
  UpdateTransactionRequest,
  TransactionViewModel,
} from "@banking/shared/types";
import { transactionsApi } from "@banking/shared/api-client/transactions";
import { categoriesApi } from "@banking/shared/api-client/categories";
import { attachmentsApi } from "@banking/shared/api-client/attachments";
import { dashboardQueryKeys } from "@dashboard/features/dashboard/api/queryKeys";
import { transactionQueryKeys } from "../api/queryKeys";
import type { AttachmentUploadFailure, TransactionSubmissionResult } from "../types";

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

export function useTransactionsQuery(
  filters: TransactionListFilters = {},
) {
  return useQuery({
    queryKey: transactionQueryKeys.list(filters),
    queryFn: ({ signal }) => transactionsApi.list(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useTransactionCategoriesQuery() {
  return useQuery({
    queryKey: transactionQueryKeys.categories(),
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTransactionAttachmentsQuery(
  transactionId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: transactionQueryKeys.attachmentList(transactionId ?? ""),
    queryFn: () => attachmentsApi.list(transactionId ?? ""),
    enabled: enabled && transactionId !== null,
  });
}

export function useCreateTransactionMutation() {
  const invalidateResources = useInvalidateTransactionResources();

  return useMutation({
    mutationFn: (transaction: CreateTransactionRequest) =>
      transactionsApi.create(transaction),
    onSuccess: invalidateResources,
  });
}

export function useUpdateTransactionMutation() {
  const invalidateResources = useInvalidateTransactionResources();

  return useMutation({
    mutationFn: ({ transactionId, transaction }: UpdateTransactionVariables) =>
      transactionsApi.update(transactionId, transaction),
    onSuccess: invalidateResources,
  });
}

export function useDeleteTransactionMutation() {
  const invalidateResources = useInvalidateTransactionResources();

  return useMutation({
    mutationFn: (transactionId: string) =>
      transactionsApi.remove(transactionId),
    onSuccess: invalidateResources,
  });
}

export function useCreateTransactionSubmissionMutation() {
  const invalidateResources = useInvalidateTransactionResources();

  return useMutation({
    mutationFn: async ({
      transaction,
      attachments,
      persistedTransaction,
    }: CreateTransactionSubmissionVariables) => {
      const savedTransaction =
        persistedTransaction ?? (await transactionsApi.create(transaction));

      return uploadTransactionAttachments(savedTransaction, attachments);
    },
    onSuccess: invalidateResources,
  });
}

export function useUpdateTransactionSubmissionMutation() {
  const invalidateResources = useInvalidateTransactionResources();

  return useMutation({
    mutationFn: async ({
      transactionId,
      transaction,
      attachments,
      persistedTransaction,
    }: UpdateTransactionSubmissionVariables) => {
      const savedTransaction =
        persistedTransaction ??
        (await transactionsApi.update(transactionId, transaction));

      return uploadTransactionAttachments(savedTransaction, attachments);
    },
    onSuccess: invalidateResources,
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

function useInvalidateTransactionResources() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all }),
    ]);
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
