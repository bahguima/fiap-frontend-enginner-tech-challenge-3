import { z } from "zod";
import type { AttachmentMetadataInput } from "@banking/shared/types";
import { transactionAttachmentPolicy } from "@banking/shared/types";

export const attachmentMetadataSchema: z.ZodType<AttachmentMetadataInput> = z.object({
  name: z.string().trim().min(1, "Informe o nome do arquivo.").refine(
    (name) => transactionAttachmentPolicy.acceptedFileExtensions.some(
      (extension) => name.toLocaleLowerCase().endsWith(extension),
    ),
    "Envie apenas arquivos PDF, JPEG ou PNG.",
  ),
  mimeType: z.string().refine(
    (mimeType) => transactionAttachmentPolicy.acceptedMimeTypes.includes(mimeType),
    "Envie apenas arquivos PDF, JPEG ou PNG.",
  ),
  sizeInBytes: z.number().int().positive("Não é possível anexar um arquivo vazio.").max(
    transactionAttachmentPolicy.maximumFileSizeInBytes,
    "Cada arquivo deve ter no máximo 5 MB.",
  ),
});

export function createAttachmentListSchema(existingAttachmentCount = 0) {
  const availableSlots = Math.max(0, transactionAttachmentPolicy.maximumFiles - existingAttachmentCount);
  return z.array(attachmentMetadataSchema).max(
    availableSlots,
    "Cada transação pode ter no máximo 5 anexos.",
  );
}
