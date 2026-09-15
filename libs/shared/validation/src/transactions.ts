import { z } from "zod";
import type { Transaction, TransactionEditableFields } from "@banking/shared/types";
import {
  isCalendarDateOnOrBefore,
  MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS,
  MINIMUM_TRANSACTION_AMOUNT_IN_CENTS,
  parseCurrencyAmount,
  toAmountInCents,
} from "@banking/shared/domain";

export {
  MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS,
  MINIMUM_TRANSACTION_AMOUNT_IN_CENTS,
};
export const TRANSACTION_OBSERVATION_MAX_LENGTH = 500;

const descriptionSchema = z.string().trim()
  .min(3, "Informe uma descrição com pelo menos 3 caracteres.")
  .max(120, "A descrição deve ter no máximo 120 caracteres.");
const observationSchema = z.string().trim()
  .max(
    TRANSACTION_OBSERVATION_MAX_LENGTH,
    `A observação deve ter no máximo ${TRANSACTION_OBSERVATION_MAX_LENGTH} caracteres.`,
  );

const transactionTypeSchema = z.enum(["income", "expense"], {
  errorMap: () => ({ message: "Selecione um tipo válido." }),
});
const transactionStatusSchema = z.enum(["completed", "pending", "failed"], {
  errorMap: () => ({ message: "Selecione um status válido." }),
});

function amountInputSchema() {
  return z.string()
    .trim()
    .min(1, "Informe o valor da transação.")
    .superRefine((value, context) => {
      const amount = parseCurrencyAmount(value);

      if (!Number.isFinite(amount)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um valor válido com até duas casas decimais.",
        });
        return;
      }

      if (amount < MINIMUM_TRANSACTION_AMOUNT_IN_CENTS / 100) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um valor de pelo menos R$ 0,01.",
        });
      } else if (amount > MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS / 100) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um valor de até R$ 999.999.999,99.",
        });
      }
    });
}

export function createTransactionFormSchema(maximumDate: string) {
  return z.object({
    description: descriptionSchema,
    amount: amountInputSchema(),
    type: transactionTypeSchema,
    categoryId: z.string().trim().min(1, "Selecione uma categoria."),
    date: z.string().trim().min(1, "Informe a data da transação.").refine(
      (value) => isCalendarDateOnOrBefore(value, maximumDate),
      { message: "Informe uma data válida que não esteja no futuro." },
    ),
    status: transactionStatusSchema,
    observation: observationSchema,
  }).transform(({ amount, ...values }) => ({
    ...values,
    amountInCents: toAmountInCents(parseCurrencyAmount(amount)),
  }));
}

export type TransactionFormValues = z.input<
  ReturnType<typeof createTransactionFormSchema>
>;
export type ParsedTransactionFormValues = z.output<
  ReturnType<typeof createTransactionFormSchema>
>;

export function createTransactionSchema(maximumDate: string): z.ZodType<Transaction> {
  return z.object({
    id: z.string().trim().min(1),
    description: descriptionSchema,
    observation: observationSchema,
    amountInCents: z.number().int().min(MINIMUM_TRANSACTION_AMOUNT_IN_CENTS).max(MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS),
    type: transactionTypeSchema,
    categoryId: z.string().trim().min(1),
    category: z.string().trim().min(1),
    date: z.string().refine((value) => isCalendarDateOnOrBefore(value, maximumDate), {
      message: "Informe uma data válida que não esteja no futuro.",
    }),
    status: transactionStatusSchema,
    attachmentCount: z.number().int().min(0),
  });
}

export function createTransactionEditableFieldsSchema(
  maximumDate: string,
): z.ZodType<TransactionEditableFields> {
  return z.object({
    description: descriptionSchema,
    type: transactionTypeSchema,
    category: z.string().trim().min(1, "Selecione uma categoria."),
    amount: z.coerce.number({ invalid_type_error: "Informe um valor válido." })
      .min(0.01, "Informe um valor de pelo menos R$ 0,01.")
      .max(999_999_999.99, "Informe um valor de até R$ 999.999.999,99."),
    date: z.string().min(1, "Informe a data da transação.").refine(
      (value) => isCalendarDateOnOrBefore(value, maximumDate),
      { message: "Informe uma data válida que não esteja no futuro." },
    ),
    status: transactionStatusSchema,
    observation: observationSchema,
  });
}
