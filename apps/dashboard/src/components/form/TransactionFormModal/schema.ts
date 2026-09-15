import { z } from "zod";
import {
  transactionAttachmentPolicy,
  type TransactionEditableFields,
} from "@banking/shared/types";
import { createTransactionEditableFieldsSchema } from "@banking/shared/validation";
import { getCalendarDateValue } from "@banking/shared/domain";

export interface TransactionFormValues {
  transaction: TransactionEditableFields;
  attachments: File[];
}

const attachmentSchema = z
  .custom<File>((value) => value instanceof File, {
    message: "Selecione arquivos válidos.",
  })
  .refine((file) => file.size > 0, {
    message: "Não é possível anexar um arquivo vazio.",
  })
  .refine(
    (file) =>
      transactionAttachmentPolicy.acceptedMimeTypes.includes(file.type),
    {
      message: "Envie apenas arquivos PDF, JPEG ou PNG.",
    },
  )
  .refine(
    (file) => file.size <= transactionAttachmentPolicy.maximumFileSizeInBytes,
    {
      message: "Cada arquivo deve ter no máximo 5 MB.",
    },
  );

export function createTransactionFormSchema(
  existingAttachmentCount: number,
): z.ZodType<TransactionFormValues> {
  const availableAttachmentSlots = Math.max(
    0,
    transactionAttachmentPolicy.maximumFiles - existingAttachmentCount,
  );

  return z.object({
    transaction: createTransactionEditableFieldsSchema(
      getCalendarDateValue(new Date()),
    ),
    attachments: z
      .array(attachmentSchema)
      .max(
        availableAttachmentSlots,
        "Cada transação pode ter no máximo 5 anexos.",
      ),
  });
}

export function getDefaultTransactionFormValues(
  category = "",
): TransactionFormValues {
  return {
    transaction: {
      description: "",
      type: "income",
      category,
      amount: 0,
      date: getCurrentDateValue(),
      status: "completed",
      observation: "",
    },
    attachments: [],
  };
}

export function getEditTransactionFormValues(
  transaction: TransactionEditableFields,
): TransactionFormValues {
  return {
    transaction,
    attachments: [],
  };
}

export function getCurrentDateValue() {
  return getCalendarDateValue(new Date());
}
