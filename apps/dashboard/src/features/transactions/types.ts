import type { TransactionAttachment, TransactionViewModel } from "@banking/shared/types";

export interface AttachmentUploadFailure {
  file: File;
  message: string;
}

export interface TransactionSubmissionResult {
  transaction: TransactionViewModel;
  uploadedAttachments: TransactionAttachment[];
  failedAttachments: AttachmentUploadFailure[];
}
