export interface MobileAttachmentInput {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

export type MobileAttachmentStatus = "pending" | "ready" | "failed";

export interface MobileTransactionAttachment {
  id: string;
  transactionId: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
  status: MobileAttachmentStatus;
  createdAt: string;
  downloadUrl?: string;
}

export interface UploadAttachmentVariables {
  transactionId: string;
  attachmentId: string;
  input: MobileAttachmentInput;
  onProgress?: (progress: number) => void;
}

export interface DeleteAttachmentVariables {
  transactionId: string;
  attachmentId: string;
}

export interface AttachmentsRepository {
  createId(): string;
  list(uid: string, transactionId: string): Promise<MobileTransactionAttachment[]>;
  upload(
    uid: string,
    variables: UploadAttachmentVariables,
  ): Promise<MobileTransactionAttachment>;
  remove(uid: string, variables: DeleteAttachmentVariables): Promise<void>;
}

export interface AttachmentUploadFailure {
  attachmentId: string;
  name: string;
  message: string;
}

export interface AttachmentUploadSummary {
  uploaded: MobileTransactionAttachment[];
  failed: AttachmentUploadFailure[];
}
