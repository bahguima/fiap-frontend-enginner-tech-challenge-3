export interface TransactionAttachmentPolicy {
  maximumFiles: number;
  maximumFileSizeInBytes: number;
  acceptedMimeTypes: readonly string[];
  acceptedFileExtensions: readonly string[];
}

export const transactionAttachmentPolicy: TransactionAttachmentPolicy = {
  maximumFiles: 5,
  maximumFileSizeInBytes: 5 * 1024 * 1024,
  acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  acceptedFileExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
};

export interface AttachmentMetadataInput {
  name: string;
  mimeType: string;
  sizeInBytes: number;
}

export interface TransactionAttachment {
  id: string;
  transactionId: string;
  fileName: string;
  contentType: string;
  size: number;
  formattedSize: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface AttachmentListResponse {
  items: TransactionAttachment[];
}
