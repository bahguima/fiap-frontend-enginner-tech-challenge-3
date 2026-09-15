export interface TransactionAttachmentPolicy {
    maximumFiles: number;
    maximumFileSizeInBytes: number;
    acceptedMimeTypes: readonly string[];
    acceptedFileExtensions: readonly string[];
}
export declare const transactionAttachmentPolicy: TransactionAttachmentPolicy;
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
