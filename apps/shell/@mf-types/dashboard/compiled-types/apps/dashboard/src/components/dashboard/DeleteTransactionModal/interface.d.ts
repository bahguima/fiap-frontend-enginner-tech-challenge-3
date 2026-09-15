import type { TransactionViewModel } from "@banking/shared/types";
export interface DeleteTransactionModalProps {
    "data-testid"?: string;
    open: boolean;
    transaction?: TransactionViewModel | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    errorMessage?: string | null;
    isSubmitting?: boolean;
}
