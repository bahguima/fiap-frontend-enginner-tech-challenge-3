import type {
  TransactionAttachment,
  TransactionViewModel,
} from "@banking/shared/types";

export interface TransactionDetailsModalProps {
  "data-testid"?: string;
  open: boolean;
  transaction?: TransactionViewModel | null;
  attachments: TransactionAttachment[];
  isAttachmentsError: boolean;
  isAttachmentsLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onRetryAttachments: () => void;
}
