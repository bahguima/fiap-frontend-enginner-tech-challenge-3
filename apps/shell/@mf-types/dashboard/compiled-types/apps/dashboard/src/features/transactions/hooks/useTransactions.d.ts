import type { CreateTransactionRequest, TransactionEditableFields, TransactionListFilters, UpdateTransactionRequest, TransactionViewModel } from "@banking/shared/types";
import type { TransactionSubmissionResult } from "../types";
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
export declare function useTransactionsQuery(filters?: TransactionListFilters): import("@tanstack/react-query").UseQueryResult<import("@banking/shared/types").TransactionListResponse, Error>;
export declare function useTransactionCategoriesQuery(): import("@tanstack/react-query").UseQueryResult<import("@banking/shared/types").CategoryListResponse, Error>;
export declare function useTransactionAttachmentsQuery(transactionId: string | null, enabled: boolean): import("@tanstack/react-query").UseQueryResult<import("@banking/shared/types").AttachmentListResponse, Error>;
export declare function useCreateTransactionMutation(): import("@tanstack/react-query").UseMutationResult<TransactionViewModel, Error, CreateTransactionRequest, unknown>;
export declare function useUpdateTransactionMutation(): import("@tanstack/react-query").UseMutationResult<TransactionViewModel, Error, UpdateTransactionVariables, unknown>;
export declare function useDeleteTransactionMutation(): import("@tanstack/react-query").UseMutationResult<import("@banking/shared/types").ApiMessageResponse, Error, string, unknown>;
export declare function useCreateTransactionSubmissionMutation(): import("@tanstack/react-query").UseMutationResult<TransactionSubmissionResult, Error, CreateTransactionSubmissionVariables, unknown>;
export declare function useUpdateTransactionSubmissionMutation(): import("@tanstack/react-query").UseMutationResult<TransactionSubmissionResult, Error, UpdateTransactionSubmissionVariables, unknown>;
export declare function useDeleteTransactionAttachmentMutation(): import("@tanstack/react-query").UseMutationResult<import("@banking/shared/types").ApiMessageResponse, Error, DeleteTransactionAttachmentVariables, unknown>;
