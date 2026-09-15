import type { TransactionAttachment, TransactionCategory, TransactionEditableFields, TransactionViewModel } from "@banking/shared/types";
import type { TransactionSubmissionResult } from "@dashboard/features/transactions/types";
export interface ITransactionFormModalProps {
    "data-testid"?: string;
    mode: "create" | "edit";
    open: boolean;
    transaction?: TransactionViewModel | null;
    categories: TransactionCategory[];
    existingAttachments: TransactionAttachment[];
    isCategoriesError: boolean;
    isCategoriesLoading: boolean;
    isExistingAttachmentsError: boolean;
    isExistingAttachmentsLoading: boolean;
    isRemovingAttachment: boolean;
    onOpenChange: (open: boolean) => void;
    onRemoveExistingAttachment: (attachmentId: string) => void;
    onSubmit: (transaction: TransactionEditableFields, attachments: File[], persistedTransaction: TransactionViewModel | null) => Promise<TransactionSubmissionResult>;
    errorMessage?: string | null;
    isSubmitting?: boolean;
}
export interface ICategoryOptionItemsProps {
    categories: TransactionCategory[];
    index?: number;
}
