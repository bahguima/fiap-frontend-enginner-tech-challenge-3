import type { ApiMessageResponse, AttachmentListResponse, TransactionAttachment } from "@banking/shared/types";
export interface WebAttachmentInput {
    file: File;
}
export interface AttachmentsApi {
    list: (transactionId: string) => Promise<AttachmentListResponse>;
    create: (transactionId: string, attachment: WebAttachmentInput) => Promise<TransactionAttachment>;
    remove: (attachmentId: string) => Promise<ApiMessageResponse>;
}
export declare const attachmentsApi: AttachmentsApi;
