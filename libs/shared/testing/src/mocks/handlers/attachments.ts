import { http, HttpResponse } from "msw";
import type {
  ApiErrorResponse,
  ApiMessageResponse,
  AttachmentListResponse,
  TransactionAttachment,
} from "@banking/shared/types";
import { transactionAttachmentPolicy } from "@banking/shared/types";
import { attachmentMetadataSchema } from "@banking/shared/validation";
import { mockApiEndpoints } from "@banking/shared/api-client/endpoints";
import {
  createMockAttachment,
  deleteMockAttachment,
  findMockTransaction,
  listMockAttachments,
} from "../state";
import { applyMockBehavior, createErrorResponse } from "./behavior";

export interface TransactionAttachmentPathParams {
  transactionId: string;
}

export interface AttachmentPathParams {
  attachmentId: string;
}

export const attachmentHandlers = [
  http.get<
    TransactionAttachmentPathParams,
    never,
    AttachmentListResponse | ApiErrorResponse
  >(
    mockApiEndpoints.transactions.attachments,
    async ({ params, request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;

      if (!findMockTransaction(params.transactionId)) {
        return createErrorResponse(
          404,
          "NOT_FOUND",
          "Transação não encontrada.",
        );
      }

      return HttpResponse.json<AttachmentListResponse>({
        items: listMockAttachments(params.transactionId),
      });
    },
  ),
  http.post<
    TransactionAttachmentPathParams,
    never,
    TransactionAttachment | ApiErrorResponse
  >(
    mockApiEndpoints.transactions.attachments,
    async ({ params, request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;

      if (!findMockTransaction(params.transactionId)) {
        return createErrorResponse(
          404,
          "NOT_FOUND",
          "Transação não encontrada.",
        );
      }

      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File) || !file.name.trim() || file.size <= 0) {
        return createErrorResponse(
          422,
          "VALIDATION_ERROR",
          "O arquivo do anexo é inválido.",
        );
      }

      const attachmentValidation = attachmentMetadataSchema.safeParse({
        name: file.name,
        mimeType: file.type,
        sizeInBytes: file.size,
      });

      if (!attachmentValidation.success && !transactionAttachmentPolicy.acceptedMimeTypes.includes(file.type)) {
        return createErrorResponse(
          422,
          "VALIDATION_ERROR",
          "O tipo do arquivo não é permitido.",
          { file: ["Envie um arquivo PDF, JPEG ou PNG."] },
        );
      }

      if (file.size > transactionAttachmentPolicy.maximumFileSizeInBytes) {
        return createErrorResponse(
          422,
          "VALIDATION_ERROR",
          "O arquivo excede o tamanho permitido.",
          { file: ["Cada arquivo deve ter no máximo 5 MB."] },
        );
      }

      if (
        listMockAttachments(params.transactionId).length >=
        transactionAttachmentPolicy.maximumFiles
      ) {
        return createErrorResponse(
          422,
          "VALIDATION_ERROR",
          "A transação atingiu o limite de anexos.",
          { file: ["Cada transação pode ter no máximo 5 anexos."] },
        );
      }

      return HttpResponse.json<TransactionAttachment>(
        createMockAttachment(params.transactionId, file),
        { status: 201 },
      );
    },
  ),
  http.delete<
    AttachmentPathParams,
    never,
    ApiMessageResponse | ApiErrorResponse
  >(
    mockApiEndpoints.attachments.detail,
    async ({ params, request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;

      if (!deleteMockAttachment(params.attachmentId)) {
        return createErrorResponse(404, "NOT_FOUND", "Anexo não encontrado.");
      }

      return HttpResponse.json<ApiMessageResponse>({
        message: "Anexo excluído com sucesso.",
      });
    },
  ),
];
