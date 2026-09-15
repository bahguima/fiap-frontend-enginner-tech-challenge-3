import { createAttachmentListSchema } from "@banking/shared/validation";

import type { MobileAttachmentInput } from "../types/attachments";

export function validateMobileAttachments(
  attachments: MobileAttachmentInput[],
  existingAttachmentCount = 0,
): MobileAttachmentInput[] {
  createAttachmentListSchema(existingAttachmentCount).parse(
    attachments.map(({ name, mimeType, size }) => ({
      name,
      mimeType,
      sizeInBytes: size,
    })),
  );

  for (const attachment of attachments) {
    if (!attachment.uri.trim()) {
      throw new Error("Não foi possível acessar o arquivo selecionado.");
    }
  }

  return attachments;
}

export function attachmentErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues?: unknown }).issues)
  ) {
    const issue = (error as { issues: Array<{ message?: unknown }> }).issues[0];
    if (typeof issue?.message === "string") return issue.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível processar o comprovante.";
}
